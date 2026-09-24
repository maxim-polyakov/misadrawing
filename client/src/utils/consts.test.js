import {
    ADMIN_ROUTE,
    GALLERY_ROUTE,
    LOGIN_ROUTE,
    REGISTRATION_ROUTE,
} from "./consts";

describe("route constants", () => {
    it("exposes the expected paths", () => {
        expect(LOGIN_ROUTE).toBe("/login");
        expect(REGISTRATION_ROUTE).toBe("/registration");
        expect(GALLERY_ROUTE).toBe("/gallery");
        expect(ADMIN_ROUTE).toBe("/admin");
    });

    it("declares every route as an absolute path and keeps them unique", () => {
        const routes = [
            LOGIN_ROUTE,
            REGISTRATION_ROUTE,
            GALLERY_ROUTE,
            ADMIN_ROUTE,
        ];

        routes.forEach((route) => expect(route.startsWith("/")).toBe(true));
        expect(new Set(routes).size).toBe(routes.length);
    });
});
