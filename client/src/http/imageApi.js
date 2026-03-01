import { $host, $authhost } from ".";

function formatUploadError(err, context) {
    const url = process.env.REACT_APP_API_URL || "";
    const fullUrl = `${url}/api/images/${context}`;

    if (err.response) {
        return `Сервер ответил ${err.response.status}: ${err.response.data?.message || err.response.statusText}. URL: ${fullUrl}`;
    }
    if (err.code === "ECONNABORTED") {
        return `Таймаут (2 мин). Файл слишком большой или медленное соединение. URL: ${fullUrl}`;
    }
    if (err.code === "ERR_NETWORK" || err.message?.includes("Network Error")) {
        return `NetworkError: запрос не дошёл до сервера. Возможные причины: CORS, сервер недоступен, прокси/nginx блокирует. URL: ${fullUrl}. Код: ${err.code || "—"}`;
    }
    if (err.code === "ERR_BAD_REQUEST") {
        return `Ошибка запроса: ${err.message}. URL: ${fullUrl}`;
    }
    return `Ошибка: ${err.message || err.code || "неизвестно"}. URL: ${fullUrl}`;
}

export const getImages = async () => {
    const { data } = await $host.get("api/images");
    return data;
};

export const deleteImage = async (id) => {
    const { data } = await $authhost.delete(`api/images/${id}`);
    return data;
};

export const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append("image", file);
    try {
        const { data } = await $authhost.post("api/images/upload", formData, {
            timeout: 120000,
        });
        return data;
    } catch (err) {
        err.detail = formatUploadError(err, "upload");
        throw err;
    }
};

export const uploadBackground = async (file) => {
    const formData = new FormData();
    formData.append("image", file);
    try {
        const { data } = await $authhost.post("api/images/upload-background", formData, {
            timeout: 120000,
        });
        return data;
    } catch (err) {
        err.detail = formatUploadError(err, "upload-background");
        throw err;
    }
};
