import { $authhost, $host } from "./index";
import {
    deleteImage,
    getImages,
    uploadBackground,
    uploadImage,
} from "./imageApi";

jest.mock("./index", () => ({
    $host: { get: jest.fn() },
    $authhost: { get: jest.fn(), post: jest.fn(), delete: jest.fn() },
}));

const originalApiUrl = process.env.REACT_APP_API_URL;

beforeEach(() => {
    jest.clearAllMocks();
    process.env.REACT_APP_API_URL = "https://api.example.com";
});

afterEach(() => {
    process.env.REACT_APP_API_URL = originalApiUrl;
});

describe("getImages", () => {
    it("returns the payload from the public host", async () => {
        const images = [{ id: 1 }, { id: 2 }];
        $host.get.mockResolvedValue({ data: images });

        await expect(getImages()).resolves.toEqual(images);
        expect($host.get).toHaveBeenCalledWith("api/images");
    });
});

describe("deleteImage", () => {
    it("deletes through the authorized host", async () => {
        $authhost.delete.mockResolvedValue({ data: { id: 7 } });

        await expect(deleteImage(7)).resolves.toEqual({ id: 7 });
        expect($authhost.delete).toHaveBeenCalledWith("api/images/7");
    });
});

describe("uploadImage", () => {
    it("posts the file as multipart form data with a timeout", async () => {
        $authhost.post.mockResolvedValue({ data: { id: 3 } });
        const file = new File(["data"], "drawing.png", { type: "image/png" });

        await expect(uploadImage(file)).resolves.toEqual({ id: 3 });

        const [url, formData, config] = $authhost.post.mock.calls[0];
        expect(url).toBe("api/images/upload");
        expect(formData).toBeInstanceOf(FormData);
        expect(formData.get("image")).toBe(file);
        expect(config).toEqual({ timeout: 120000 });
    });

    it("annotates a server error with status and url details", async () => {
        $authhost.post.mockRejectedValue({
            response: { status: 500, data: { message: "Boom" }, statusText: "Error" },
        });

        await expect(
            uploadImage(new File(["data"], "drawing.png"))
        ).rejects.toMatchObject({
            detail:
                "Сервер ответил 500: Boom. URL: https://api.example.com/api/images/upload",
        });
    });

    it("annotates a timeout error", async () => {
        $authhost.post.mockRejectedValue({ code: "ECONNABORTED" });

        await expect(
            uploadImage(new File(["data"], "drawing.png"))
        ).rejects.toMatchObject({
            detail: expect.stringContaining("Таймаут (2 мин)"),
        });
    });

    it("annotates a network error", async () => {
        $authhost.post.mockRejectedValue({
            code: "ERR_NETWORK",
            message: "Network Error",
        });

        await expect(
            uploadImage(new File(["data"], "drawing.png"))
        ).rejects.toMatchObject({
            detail: expect.stringContaining("NetworkError"),
        });
    });
});

describe("uploadBackground", () => {
    it("posts to the background endpoint", async () => {
        $authhost.post.mockResolvedValue({ data: { id: 9 } });
        const file = new File(["data"], "bg.png", { type: "image/png" });

        await expect(uploadBackground(file)).resolves.toEqual({ id: 9 });
        expect($authhost.post.mock.calls[0][0]).toBe(
            "api/images/upload-background"
        );
    });

    it("reports the background url in the error detail", async () => {
        $authhost.post.mockRejectedValue({ message: "weird failure" });

        await expect(
            uploadBackground(new File(["data"], "bg.png"))
        ).rejects.toMatchObject({
            detail:
                "Ошибка: weird failure. URL: https://api.example.com/api/images/upload-background",
        });
    });
});
