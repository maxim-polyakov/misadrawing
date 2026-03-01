import { $host, $authhost } from ".";

export const getImages = async () => {
    const { data } = await $host.get("api/images");
    return data; // { images: [...], backgroundUrl: "..." }
};

export const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append("image", file);
    const { data } = await $authhost.post("api/images/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000,
    });
    return data;
};

export const uploadBackground = async (file) => {
    const formData = new FormData();
    formData.append("image", file);
    const { data } = await $authhost.post("api/images/upload-background", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000,
    });
    return data;
};
