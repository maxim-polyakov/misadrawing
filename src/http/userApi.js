import { $host, $authhost } from ".";
import { jwtDecode } from "jwt-decode";

export const registration = async (email, password) => {
    try {
        const {data} = await $host.post("api/user/registration", {
            email,
            password,
            role: "USER",
        });
        localStorage.setItem("token", data.token);
        return jwtDecode(data.token);
    }
    catch (error) {
        console.log(error);
    }
};

export const login = async (email, password) => {
    try {
        const {data} = await $host.post("api/user/login", {
            email,
            password,
        });
        localStorage.setItem("token", data.token);
        return jwtDecode(data.token);
    } catch (error) {
        console.log(error);
    }
};

export const check = async () => {
    try {
        const {data} = await $authhost.get("api/user/auth");
        localStorage.setItem("token", data.token);
        return jwtDecode(data.token);
    } catch (error) {
        console.log("Не авторизован");
    }
};
