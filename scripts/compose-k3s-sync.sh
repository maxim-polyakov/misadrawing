#!/usr/bin/env bash
set -Eeuo pipefail

usage() {
  cat <<'EOF'
Usage: compose-k3s-sync --project-dir DIR [options]

Build Docker Compose services, import immutable copies of locally built images
into the k3s containerd on this node, and roll out matching Deployments.

Options:
  --project-dir DIR       Directory containing docker-compose.yml (required)
  --project-name NAME     Override the Compose/Kubernetes project name
  --env-file FILE         Compose env file, relative to project directory
  --compose-file FILE     Compose file, relative to project directory
  --skip-build            Use images already built by Docker Compose
  --no-cache              Pass --no-cache to docker compose build
  --dry-run               Print the planned service/deployment mapping only
  --timeout DURATION      kubectl rollout timeout (default: 10m)
  -h, --help              Show this help

Environment:
  COMPOSE_K3S_EXTRA_NAMESERVERS   Public resolvers for Maildev/SMTP pods (default: 8.8.8.8,1.1.1.1)
  COMPOSE_K3S_SKIP_SMTP_DNS       Set to 1 to skip SMTP/Maildev external DNS patch
EOF
}

log() {
  printf '[compose-k3s-sync] %s\n' "$*"
}

die() {
  printf '[compose-k3s-sync] ERROR: %s\n' "$*" >&2
  exit 1
}

project_dir=
project_name_override=
env_file=
compose_file=
skip_build=false
no_cache=false
dry_run=false
rollout_timeout=10m

while (($#)); do
  case "$1" in
    --project-dir)
      (($# >= 2)) || die "--project-dir requires a value"
      project_dir=$2
      shift 2
      ;;
    --project-name)
      (($# >= 2)) || die "--project-name requires a value"
      project_name_override=$2
      shift 2
      ;;
    --env-file)
      (($# >= 2)) || die "--env-file requires a value"
      env_file=$2
      shift 2
      ;;
    --compose-file)
      (($# >= 2)) || die "--compose-file requires a value"
      compose_file=$2
      shift 2
      ;;
    --skip-build)
      skip_build=true
      shift
      ;;
    --no-cache)
      no_cache=true
      shift
      ;;
    --dry-run)
      dry_run=true
      shift
      ;;
    --timeout)
      (($# >= 2)) || die "--timeout requires a value"
      rollout_timeout=$2
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      die "unknown argument: $1"
      ;;
  esac
done

[[ -n "$project_dir" ]] || die "--project-dir is required"
project_dir=$(cd "$project_dir" && pwd)

for command in docker k3s python3 flock; do
  command -v "$command" >/dev/null 2>&1 || die "required command not found: $command"
done

if docker compose version >/dev/null 2>&1; then
  compose=(docker compose)
  image_separator=-
elif command -v docker-compose >/dev/null 2>&1; then
  compose=(docker-compose)
  image_separator=_
else
  die "neither docker compose nor docker-compose is available"
fi
if [[ -n "$project_name_override" ]]; then
  compose+=(-p "$project_name_override")
fi
kube=(k3s kubectl)
kubeconfig=${COMPOSE_K3S_KUBECONFIG:-}
if [[ -z "$kubeconfig" || ! -r "$kubeconfig" ]]; then
  for candidate in \
    /etc/rancher/k3s/compose-sync.yaml \
    "${HOME}/.kube/config" \
    /etc/rancher/k3s/k3s.yaml; do
    if [[ -r "$candidate" ]]; then
      kubeconfig=$candidate
      break
    fi
  done
fi
if [[ -n "$kubeconfig" && -r "$kubeconfig" ]]; then
  kube+=(--kubeconfig "$kubeconfig")
fi
k3s_bin=$(command -v k3s)
k3s_ctr=("$k3s_bin" ctr)
if ! "$k3s_bin" ctr -n k8s.io images ls >/dev/null 2>&1; then
  if sudo -n "$k3s_bin" ctr -n k8s.io images ls >/dev/null 2>&1; then
    k3s_ctr=(sudo -n "$k3s_bin" ctr)
  else
    die "cannot access k3s containerd; allow: sudo -n $k3s_bin ctr ..."
  fi
fi
if [[ -n "$compose_file" ]]; then
  [[ -f "$project_dir/$compose_file" ]] || die "compose file not found: $compose_file"
  compose+=(-f "$compose_file")
fi
if [[ -n "$env_file" ]]; then
  [[ -f "$project_dir/$env_file" ]] || die "env file not found: $env_file"
  compose+=(--env-file "$env_file")
fi

cd "$project_dir"
config_json=$(mktemp)
config_yaml=$(mktemp)
trap 'rm -f "$config_json" "$config_yaml"' EXIT
config_ready=false
if [[ "$image_separator" == "-" ]] &&
  "${compose[@]}" config --format json >"$config_json" 2>/dev/null; then
  config_ready=true
fi
if [[ "$config_ready" != true ]]; then
  "${compose[@]}" config >"$config_yaml"
  python3 - "$config_yaml" "$config_json" <<'PY'
import json
import sys

try:
    import yaml
except ImportError as error:
    raise SystemExit(
        "PyYAML is required with this Docker Compose version"
    ) from error

with open(sys.argv[1], encoding="utf-8") as source:
    config = yaml.safe_load(source)
with open(sys.argv[2], "w", encoding="utf-8") as target:
    json.dump(config, target)
PY
fi

python3 - "$config_json" "$project_dir" "$project_name_override" <<'PY'
import json
import re
import sys
from pathlib import Path

path = Path(sys.argv[1])
with path.open(encoding="utf-8") as stream:
    config = json.load(stream)
if sys.argv[3]:
    config["name"] = sys.argv[3]
elif not config.get("name"):
    config["name"] = re.sub(
        r"[^a-z0-9_-]+", "", Path(sys.argv[2]).name.lower()
    )
with path.open("w", encoding="utf-8") as stream:
    json.dump(config, stream)
PY

project_name=$(
  python3 - "$config_json" <<'PY'
import json
import sys

with open(sys.argv[1], encoding="utf-8") as stream:
    print(json.load(stream)["name"])
PY
)

kube_project=$(
  python3 - "$project_name" <<'PY'
import re
import sys

value = re.sub(r"[^a-z0-9]+", "-", sys.argv[1].lower()).strip("-")
print(value)
PY
)
[[ -n "$kube_project" ]] || die "cannot normalize Compose project name: $project_name"

lock_dir=${COMPOSE_K3S_LOCK_DIR:-${XDG_RUNTIME_DIR:-/tmp}}
mkdir -p "$lock_dir"
exec 9>"${lock_dir}/compose-k3s-sync-${kube_project}.lock"
flock -n 9 || die "another deployment of $kube_project is already running"

mapfile -t sync_services < <(
  python3 - "$config_json" "$image_separator" <<'PY'
import json
import sys

with open(sys.argv[1], encoding="utf-8") as stream:
    config = json.load(stream)

project = config["name"]
separator = sys.argv[2]
has_builds = any("build" in service for service in config["services"].values())
for name, service in config["services"].items():
    if has_builds and "build" not in service:
        continue
    if "build" not in service and not service.get("image"):
        continue
    explicit_image = "1" if service.get("image") else "0"
    image = service.get("image") or f"{project}{separator}{name}"
    replicas = service.get("deploy", {}).get("replicas", 1)
    print(f"{name}\t{image}\t{replicas}\t{explicit_image}")
PY
)

((${#sync_services[@]})) || die "Compose project has no syncable services"

if [[ "$dry_run" != true ]]; then
  log "removing Compose runtime containers for $project_name"
  "${compose[@]}" down --remove-orphans
fi

if [[ "$skip_build" != true && "$dry_run" != true ]]; then
  log "building Compose project $project_name"
  build_args=()
  [[ "$no_cache" == true ]] && build_args+=(--no-cache)
  "${compose[@]}" build "${build_args[@]}"
fi

local_ips=" $(hostname -I 2>/dev/null || true) "
matched_services=0

for row in "${sync_services[@]}"; do
  IFS=$'\t' read -r service source_image replicas explicit_image <<<"$row"

  mapfile -t matches < <(
    "${kube[@]}" get deployment -A \
      -l "compose.project=${kube_project},compose.service=${service}" \
      -o jsonpath='{range .items[*]}{.metadata.namespace}{"\t"}{.metadata.name}{"\n"}{end}'
  )
  if ((${#matches[@]} == 0)); then
    log "skipping $service: no matching Deployment"
    continue
  fi
  ((${#matches[@]} == 1)) || die \
    "expected one Deployment for ${kube_project}/${service}, found ${#matches[@]}"
  ((matched_services += 1))

  IFS=$'\t' read -r namespace deployment <<<"${matches[0]}"
  target_node=$("${kube[@]}" get deployment "$deployment" -n "$namespace" \
    -o jsonpath='{.spec.template.spec.nodeSelector.kubernetes\.io/hostname}')
  [[ -n "$target_node" ]] || die "$namespace/$deployment is not pinned to a node"

  target_ip=$("${kube[@]}" get node "$target_node" \
    -o jsonpath='{range .status.addresses[?(@.type=="InternalIP")]}{.address}{end}')
  [[ -n "$target_ip" ]] || die "cannot determine InternalIP of node $target_node"
  [[ "$local_ips" == *" $target_ip "* ]] || die \
    "$namespace/$deployment targets $target_node ($target_ip), not this node"

  if [[ "$dry_run" == true ]]; then
    log "would sync $source_image -> $namespace/$deployment on $target_node"
    continue
  fi

  image_id=$(docker image inspect "$source_image" --format '{{.Id}}') ||
    die "Docker image not found after build: $source_image"
  short_id=${image_id#sha256:}
  short_id=${short_id:0:16}
  immutable_image="compose-sync/${kube_project}-${service}:${short_id}"
  deployment_image=$immutable_image
  pull_policy=Never

  media_type=$(
    docker image inspect "$source_image" |
      python3 -c 'import json, sys; print((json.load(sys.stdin)[0].get("Descriptor") or {}).get("mediaType", ""))'
  )
  if [[ "$media_type" == *".image.index."* ||
        "$media_type" == *".manifest.list."* ]]; then
    registry_digest=$(
      docker image inspect "$source_image" |
        python3 -c 'import json, sys; print(next((item for item in json.load(sys.stdin)[0].get("RepoDigests", []) if not item.startswith("compose-sync/") and "/compose-sync/" not in item), ""))'
    )
    [[ "$explicit_image" == 1 && -n "$registry_digest" ]] || die \
      "$source_image is a multi-platform image without a registry digest"
    deployment_image=$registry_digest
    pull_policy=IfNotPresent
    log "using registry digest $deployment_image for multi-platform image"
  else
    log "importing $source_image as $immutable_image"
    docker image tag "$source_image" "$immutable_image"
    docker image save "$immutable_image" | "${k3s_ctr[@]}" -n k8s.io images import -
  fi

  container=$("${kube[@]}" get deployment "$deployment" -n "$namespace" \
    -o jsonpath='{.spec.template.spec.containers[0].name}')
  [[ -n "$container" ]] || die "cannot determine container for $namespace/$deployment"

  # hostPort workloads cannot use maxSurge on a single pinned node.
  "${kube[@]}" patch deployment "$deployment" -n "$namespace" --type merge \
    -p '{"spec":{"strategy":{"type":"Recreate","rollingUpdate":null}}}' >/dev/null
  "${kube[@]}" set image deployment/"$deployment" -n "$namespace" \
    "$container=$deployment_image" >/dev/null
  "${kube[@]}" patch deployment "$deployment" -n "$namespace" --type strategic \
    -p "{\"spec\":{\"template\":{\"spec\":{\"containers\":[{\"name\":\"${container}\",\"imagePullPolicy\":\"${pull_policy}\"}]}}}}" \
    >/dev/null
  "${kube[@]}" patch deployment "$deployment" -n "$namespace" --type merge \
    -p "{\"spec\":{\"template\":{\"metadata\":{\"annotations\":{\"sync.compose/image-id\":\"${image_id}\",\"sync.compose/source-image\":\"${source_image}\"}}}}}" \
    >/dev/null
  "${kube[@]}" scale deployment "$deployment" -n "$namespace" \
    --replicas="$replicas" >/dev/null
  "${kube[@]}" rollout status deployment/"$deployment" -n "$namespace" \
    --timeout="$rollout_timeout"
  log "updated $namespace/$deployment"
done

((matched_services > 0)) || die "no matching Deployments found for $kube_project"

if [[ "$dry_run" != true ]]; then
  # Internal traffic uses ClusterIP + CoreDNS. Maildev auto-relay needs public DNS when
  # cluster DNS to the internet is flaky on pinned workers.
  export COMPOSE_K3S_EXTRA_NAMESERVERS="${COMPOSE_K3S_EXTRA_NAMESERVERS:-8.8.8.8,1.1.1.1}"
  log "SMTP/Maildev external DNS patch for $kube_project (no hostAliases)"
  python3 - "$kube_project" "${kube[@]}" <<'PY'
import json
import os
import subprocess
import sys

kube_project = sys.argv[1]
kube = sys.argv[2:]

def kubectl(*args, check=True):
    return subprocess.run(
        [*kube, *args],
        check=check,
        capture_output=True,
        text=True,
    )


extra_ns_raw = os.environ.get("COMPOSE_K3S_EXTRA_NAMESERVERS", "8.8.8.8,1.1.1.1")
skip_smtp_dns = os.environ.get("COMPOSE_K3S_SKIP_SMTP_DNS", "").lower() in (
    "1",
    "true",
    "yes",
)
nameservers: list[str] = []
if not skip_smtp_dns:
    nameservers = [ns.strip() for ns in extra_ns_raw.split(",") if ns.strip()]


def is_smtp_deployment(deploy: dict) -> bool:
    meta = deploy["metadata"]
    name = meta["name"].lower()
    svc = meta.get("labels", {}).get("compose.service", meta["name"]).lower()
    if "smtp" in name or "smtp" in svc or "maildev" in name:
        return True
    for container in deploy["spec"]["template"]["spec"].get("containers", []):
        image = (container.get("image") or "").lower()
        if "maildev" in image:
            return True
    return False


raw = kubectl(
    [
        "get",
        "deploy",
        "-A",
        "-l",
        f"compose.project={kube_project}",
        "-o",
        "json",
    ]
)
deployments = json.loads(raw.stdout).get("items", [])
if not deployments:
    raise SystemExit(0)

for deploy in deployments:
    namespace = deploy["metadata"]["namespace"]
    name = deploy["metadata"]["name"]
    kubectl(
        [
            "patch",
            "deployment",
            name,
            "-n",
            namespace,
            "--type=json",
            "-p",
            '[{"op": "remove", "path": "/spec/template/spec/hostAliases"}]',
        ],
        check=False,
    )
    if not is_smtp_deployment(deploy) or not nameservers:
        continue
    patch = {
        "spec": {
            "template": {
                "spec": {
                    "dnsConfig": {
                        "nameservers": nameservers,
                        "searches": [
                            f"{namespace}.svc.cluster.local",
                            "svc.cluster.local",
                            "cluster.local",
                        ],
                        "options": [{"name": "ndots", "value": "5"}],
                    }
                }
            }
        }
    }
    kubectl(
        [
            "patch",
            "deployment",
            name,
            "-n",
            namespace,
            "--type=merge",
            "-p",
            json.dumps(patch),
        ]
    )
    print(f"patched smtp dns {namespace}/{name}", flush=True)
PY
fi

log "sync completed for $kube_project"
