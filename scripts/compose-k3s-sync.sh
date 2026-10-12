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
  --patch-only            Apply hostAliases/dnsConfig patches only (no image rollout)
  --timeout DURATION      kubectl rollout timeout (default: 10m)
  -h, --help              Show this help

Environment:
  COMPOSE_K3S_EXTRA_NAMESERVERS   Public DNS for Maildev/SMTP Deployments (default: 8.8.8.8,1.1.1.1)
  COMPOSE_K3S_SKIP_SMTP_DNS       Set to 1 to skip Maildev dnsConfig on the Deployment
  COMPOSE_K3S_STRICT_ROLLOUT      Set to 1 to fail when kubectl rollout status fails
  COMPOSE_BAKE                    Default 0 — avoid compose bake metadata-file races on build
  BUILDX_NO_DEFAULT_ATTESTATIONS  Default 1 — skip provenance attestation (metadata-file flake)
  TMPDIR                          Default /tmp for compose build temp files
  COMPOSE_K3S_LOCK_WAIT           Seconds to wait for per-project flock (0 = fail immediately)
  COMPOSE_K3S_CLEAR_ORPHAN_LOCK   Set to 1 to fuser -k stale lock holders after wait (default 1)
EOF
}

log() {
  printf '[compose-k3s-sync] %s\n' "$*"
}

die() {
  printf '[compose-k3s-sync] ERROR: %s\n' "$*" >&2
  exit 1
}

sync_compose_service_environment() {
  local namespace=$1 deployment=$2 service=$3
  local env_patch status
  env_patch=$(mktemp)
  chmod 600 "$env_patch"

  if ! python3 - "$config_json" "$service" "$env_patch" <<'PY'
import json
import sys

config_path, service_name, patch_path = sys.argv[1:]
with open(config_path, encoding="utf-8") as stream:
    service = json.load(stream)["services"][service_name]

environment = service.get("environment") or {}
if isinstance(environment, list):
    parsed = {}
    for item in environment:
        name, separator, value = str(item).partition("=")
        parsed[name] = value if separator else ""
    environment = parsed

env = [
    {"name": str(name), "value": "" if value is None else str(value)}
    for name, value in sorted(environment.items())
]
patch = [{
    "op": "add",
    "path": "/spec/template/spec/containers/0/env",
    "value": env,
}]
with open(patch_path, "w", encoding="utf-8") as stream:
    json.dump(patch, stream)
PY
  then
    rm -f "$env_patch"
    die "cannot prepare Compose environment for $service"
  fi

  if "${kube[@]}" patch deployment "$deployment" -n "$namespace" --type=json \
    --patch-file "$env_patch" >/dev/null; then
    status=0
  else
    status=$?
  fi
  rm -f "$env_patch"
  ((status == 0)) || return "$status"
  log "Compose environment synchronized for $namespace/$deployment"
}

apply_schema_patches() {
  local namespace=$1 deployment=$2 service=$3 source_image=$4

  "${kube[@]}" patch deployment "$deployment" -n "$namespace" --type=json \
    -p='[{"op":"remove","path":"/spec/template/spec/hostAliases"}]' >/dev/null 2>&1 || true

  local is_maildev=false
  if [[ "$service" == *smtp* ]] || [[ "$deployment" == *smtp* ]] || [[ "$source_image" == *maildev* ]]; then
    is_maildev=true
  fi
  if [[ "$is_maildev" == true && "${COMPOSE_K3S_SKIP_SMTP_DNS:-}" != 1 ]]; then
    sync_compose_service_environment "$namespace" "$deployment" "$service"
    local maildev_dns_patch
    maildev_dns_patch=$(
      COMPOSE_K3S_EXTRA_NAMESERVERS="${COMPOSE_K3S_EXTRA_NAMESERVERS:-8.8.8.8,1.1.1.1}" \
      NS="$namespace" python3 -c '
import json, os
ns = os.environ["NS"]
servers = [
    s.strip()
    for s in os.environ.get("COMPOSE_K3S_EXTRA_NAMESERVERS", "8.8.8.8,1.1.1.1").split(",")
    if s.strip()
]
print(
    json.dumps(
        {
            "spec": {
                "template": {
                    "spec": {
                        "dnsConfig": {
                            "nameservers": servers,
                            "searches": [
                                f"{ns}.svc.cluster.local",
                                "svc.cluster.local",
                                "cluster.local",
                            ],
                            "options": [{"name": "ndots", "value": "5"}],
                        }
                    }
                }
            }
        }
    )
)
'
    )
    "${kube[@]}" patch deployment "$deployment" -n "$namespace" --type merge \
      -p "$maildev_dns_patch" >/dev/null
    log "Maildev/SMTP Deployment dnsConfig set for $namespace/$deployment"
    fix_maildev_container_command "$namespace" "$deployment" "$source_image" "$service"
  fi
  log "schema patches applied for $namespace/$deployment"
}

fix_maildev_container_command() {
  local namespace=$1 deployment=$2 source_image=$3 service=$4
  local inspect_img=$source_image
  local workdir=/home/node/app
  if ! docker image inspect "$inspect_img" >/dev/null 2>&1; then
    inspect_img=maildev/maildev
  fi
  if docker image inspect "$inspect_img" >/dev/null 2>&1; then
    workdir=$(docker image inspect "$inspect_img" --format '{{.Config.WorkingDir}}')
  fi
  [[ -n "$workdir" ]] || workdir=/home/node/app
  # Compose→k8s: command ["bin/maildev"] without WORKDIR, or args ["-c","exec node …"] vs entrypoint node.
  "${kube[@]}" patch deployment "$deployment" -n "$namespace" --type=json \
    -p='[{"op":"remove","path":"/spec/template/spec/containers/0/command"}]' \
    >/dev/null 2>&1 || true
  local merge_patch
  merge_patch=$("${kube[@]}" get deployment "$deployment" -n "$namespace" -o json |
    WD="$workdir" python3 -c '
import json, os, re, shlex, sys
deploy = json.load(sys.stdin)
wd = os.environ["WD"]
with open(sys.argv[1], encoding="utf-8") as stream:
    service = json.load(stream)["services"][sys.argv[2]]
env_map = service.get("environment") or {}
if isinstance(env_map, list):
    env_map = dict(
        str(item).partition("=")[::2] if "=" in str(item) else (str(item), "")
        for item in env_map
    )
compose_command = service.get("command") or []
script = None
desired_args = None
if isinstance(compose_command, str):
    script = compose_command
elif (
    isinstance(compose_command, list)
    and len(compose_command) >= 2
    and compose_command[0] == "-c"
    and "maildev" in str(compose_command[1])
):
    script = str(compose_command[1])
elif isinstance(compose_command, list) and compose_command:
    desired_args = [str(value) for value in compose_command]
if script:
    match = re.search(r"maildev\.js\s+(.*)", script, re.S)
    if match:
        flags = re.sub(
            r"\$\$?\{(\w+)\}",
            lambda found: str(env_map.get(found.group(1), "") or ""),
            match.group(1),
        )
        desired_args = shlex.split(flags)
out = []
for c in deploy["spec"]["template"]["spec"]["containers"]:
    entry = {"name": c["name"], "image": c["image"], "workingDir": wd}
    if desired_args is not None:
        entry["args"] = desired_args
    out.append(entry)
print(json.dumps({"spec": {"template": {"spec": {"containers": out}}}}))
' "$config_json" "$service")
  "${kube[@]}" patch deployment "$deployment" -n "$namespace" --type strategic \
    -p "$merge_patch" >/dev/null 2>&1 || true
  "${kube[@]}" patch deployment "$deployment" -n "$namespace" --type=json \
    -p='[{"op":"remove","path":"/spec/template/spec/containers/0/command"}]' \
    >/dev/null 2>&1 || true
  log "Maildev command/workdir fix for $namespace/$deployment (workdir=$workdir)"
}

project_dir=
project_name_override=
env_file=
compose_file=
skip_build=false
no_cache=false
dry_run=false
patch_only=false
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
    --patch-only)
      patch_only=true
      skip_build=true
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
lock_file="${lock_dir}/compose-k3s-sync-${kube_project}.lock"
exec 9>"$lock_file"
lock_wait=${COMPOSE_K3S_LOCK_WAIT:-0}
clear_orphan=${COMPOSE_K3S_CLEAR_ORPHAN_LOCK:-1}
acquire_deploy_lock() {
  if flock -n 9; then
    return 0
  fi
  if [[ "$lock_wait" =~ ^[0-9]+$ && "$lock_wait" -gt 0 ]]; then
    log "deploy lock busy for $kube_project; waiting up to ${lock_wait}s"
    if flock -w "$lock_wait" 9; then
      return 0
    fi
  fi
  if [[ "$clear_orphan" == 1 ]] && command -v fuser >/dev/null 2>&1; then
    log "clearing stale lock holders for $kube_project"
    fuser -k "$lock_file" 2>/dev/null || true
    sleep 2
    if flock -n 9; then
      return 0
    fi
  fi
  return 1
}
acquire_deploy_lock || die "another deployment of $kube_project is already running (or lock wait expired)"

mapfile -t sync_services < <(
  python3 - "$config_json" "$image_separator" <<'PY'
import json
import sys

with open(sys.argv[1], encoding="utf-8") as stream:
    config = json.load(stream)

project = config["name"]
separator = sys.argv[2]
for name, service in config["services"].items():
    if "build" not in service and not service.get("image"):
        continue
    explicit_image = "1" if service.get("image") else "0"
    image = service.get("image") or f"{project}{separator}{name}"
    replicas = service.get("deploy", {}).get("replicas", 1)
    print(f"{name}\t{image}\t{replicas}\t{explicit_image}")
PY
)

((${#sync_services[@]})) || die "Compose project has no syncable services"

if [[ "$dry_run" != true && "$skip_build" != true && "$patch_only" != true ]]; then
  log "removing Compose runtime containers for $project_name"
  "${compose[@]}" down --remove-orphans
fi

compose_image_exists() {
  local service=$1
  local source_image=$2
  local candidate
  for candidate in \
    "$source_image" \
    "${project_name}${image_separator}${service}" \
    "${project_name}-${service}"; do
    if docker image inspect "$candidate" >/dev/null 2>&1; then
      printf '%s' "$candidate"
      return 0
    fi
  done
  return 1
}

compose_build_service() {
  local service=$1
  local source_image=$2
  local found
  if "${compose[@]}" build "${build_args[@]}" "$service"; then
    return 0
  fi
  if found=$(compose_image_exists "$service" "$source_image"); then
    log "compose build exited non-zero but image exists ($found); continuing (metadata-file flake)"
    return 0
  fi
  return 1
}

if [[ "$skip_build" != true && "$dry_run" != true ]]; then
  log "building Compose project $project_name"
  build_args=()
  [[ "$no_cache" == true ]] && build_args+=(--no-cache)
  export TMPDIR="${TMPDIR:-/tmp}"
  export COMPOSE_BAKE="${COMPOSE_BAKE:-0}"
  export BUILDX_NO_DEFAULT_ATTESTATIONS="${BUILDX_NO_DEFAULT_ATTESTATIONS:-1}"
  mkdir -p "$TMPDIR"
  build_services=()
  for row in "${sync_services[@]}"; do
    IFS=$'\t' read -r service _ _ _ <<<"$row"
    build_services+=("$service")
  done
  for row in "${sync_services[@]}"; do
    IFS=$'\t' read -r service source_image _ explicit_image <<<"$row"
    if [[ "$explicit_image" == 1 ]]; then
      if docker image inspect "$source_image" >/dev/null 2>&1; then
        log "image already present for $service ($source_image)"
      else
        log "pulling image for service $service ($source_image)"
        docker pull "$source_image" || die "docker pull failed for $source_image"
      fi
      continue
    fi
    log "building service $service"
    compose_build_service "$service" "$source_image" || die "compose build failed for $service"
  done
fi

local_ips=" $(hostname -I 2>/dev/null || true) "
matched_services=0
rolled_out=0
schema_patched=0

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

  if [[ "$patch_only" == true ]]; then
    apply_schema_patches "$namespace" "$deployment" "$service" "$source_image"
    ((schema_patched += 1))
    continue
  fi

  if ! image_id=$(docker image inspect "$source_image" --format '{{.Id}}' 2>/dev/null); then
    if [[ "$skip_build" == true ]]; then
      log "no local image $source_image; applying schema patches only"
      apply_schema_patches "$namespace" "$deployment" "$service" "$source_image"
      ((schema_patched += 1))
      continue
    fi
    die "Docker image not found after build: $source_image"
  fi
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

  apply_schema_patches "$namespace" "$deployment" "$service" "$source_image"

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
  if ! "${kube[@]}" rollout status deployment/"$deployment" -n "$namespace" \
    --timeout="$rollout_timeout"; then
    if [[ "${COMPOSE_K3S_STRICT_ROLLOUT:-}" == 1 ]]; then
      die "rollout failed for $namespace/$deployment"
    fi
    log "WARNING: rollout failed for $namespace/$deployment (continuing)"
    continue
  fi
  log "updated $namespace/$deployment"
  ((rolled_out += 1))
done

((matched_services > 0)) || die "no matching Deployments found for $kube_project"
((rolled_out + schema_patched > 0)) || die "no deployments updated for $kube_project"

log "sync completed for $kube_project ($rolled_out rolled out, $schema_patched schema-only)"
