import { $authhost, $host } from "./index";
import { jwtDecode } from "jwt-decode";
import { check, getGoogleLoginUrl, login, registration } from "./userApi";

jest.mock("./index", () => ({
    $host: { post: jest.fn(), get: jest.fn() },
    $authhost: { post: jest.fn(), get: jest.fn() },
}));

jest.mock("jwt-decode", () => ({ jwtDecode: jest.fn() }));

const DECODED = { id: 1, email: "user@example.com", role: "USER" };

beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    jwtDecode.mockReturnValue(DECODED);
    jest.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
    console.log.mockRestore();
});

describe("getGoogleLoginUrl", () => {
    const original = process.env.REACT_APP_API_URL;

    afterEach(() => {
        process.env.REACT_APP_API_URL = original;
    });

    it("prefixes the configured API url", () => {
        process.env.REACT_APP_API_URL = "https://api.example.com";

        expect(getGoogleLoginUrl()).toBe(
            "https://api.example.com/api/user/auth/google"
        );
    });

    it("falls back to a relative url when no API url is configured", () => {
        delete process.env.REACT_APP_API_URL;

        expect(getGoogleLoginUrl()).toBe("/api/user/auth/google");
    });
});

describe("registration", () => {
    it("stores the token and returns the decoded payload", async () => {
        $host.post.mockResolvedValue({ data: { token: "jwt-token" } });

        await expect(registration("user@example.com", "secret")).resolves.toEqual(
            DECODED
        );

        expect($host.post).toHaveBeenCalledWith("api/user/registration", {
            email: "user@example.com",
            password: "secret",
        });
        expect(localStorage.getItem("token")).toBe("jwt-token");
        expect(jwtDecode).toHaveBeenCalledWith("jwt-token");
    });

    it("surfaces the server message when registration fails", async () => {
        $host.post.mockRejectedValue({
            response: { data: { message: "Пользователь уже существует" } },
        });

        await expect(registration("user@example.com", "secret")).rejects.toThrow(
            "Пользователь уже существует"
        );
        expect(localStorage.getItem("token")).toBeNull();
    });

    it("extracts the message from an HTML error page", async () => {
        $host.post.mockRejectedValue({
            response: {
                data: "<!DOCTYPE html><body>Error: Некорректный email<br></body>",
            },
        });

        await expect(registration("bad", "secret")).rejects.toThrow(
            "Некорректный email"
        );
    });
});

describe("login", () => {
    it("stores the token and returns the decoded payload", async () => {
        $host.post.mockResolvedValue({ data: { token: "jwt-token" } });

        await expect(login("user@example.com", "secret")).resolves.toEqual(
            DECODED
        );
        expect(localStorage.getItem("token")).toBe("jwt-token");
    });

    it("maps a 401 response to a credentials error", async () => {
        $host.post.mockRejectedValue({ response: { status: 401, data: {} } });

        await expect(login("user@example.com", "nope")).rejects.toThrow(
            "Неверный email или пароль"
        );
    });

    it("prefers the server message on a 404 response", async () => {
        $host.post.mockRejectedValue({
            response: { status: 404, data: { message: "Пользователь не найден" } },
        });

        await expect(login("ghost@example.com", "secret")).rejects.toThrow(
            "Пользователь не найден"
        );
    });

    it("reports connection problems when the server never answered", async () => {
        $host.post.mockRejectedValue({ code: "ECONNREFUSED" });

        await expect(login("user@example.com", "secret")).rejects.toThrow(
            "Не удалось подключиться к серверу"
        );
    });
});

describe("check", () => {
    it("returns null without calling the API when no token is stored", async () => {
        await expect(check()).resolves.toBeNull();
        expect($authhost.get).not.toHaveBeenCalled();
    });

    it("refreshes the stored token and returns the decoded payload", async () => {
        localStorage.setItem("token", "old-token");
        $authhost.get.mockResolvedValue({ data: { token: "new-token" } });

        await expect(check()).resolves.toEqual(DECODED);

        expect($authhost.get).toHaveBeenCalledWith("api/user/auth");
        expect(localStorage.getItem("token")).toBe("new-token");
        expect(jwtDecode).toHaveBeenCalledWith("new-token");
    });

    it("drops the stored token and returns null when the check fails", async () => {
        localStorage.setItem("token", "stale-token");
        $authhost.get.mockRejectedValue(new Error("401"));

        await expect(check()).resolves.toBeNull();
        expect(localStorage.getItem("token")).toBeNull();
    });
});
