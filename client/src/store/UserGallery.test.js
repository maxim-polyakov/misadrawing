import UserGallery from "./UserGallery";

describe("UserGallery store", () => {
    it("starts unauthenticated with an empty user", () => {
        const store = new UserGallery();

        expect(store.isAuth).toBe(false);
        expect(store.user).toEqual({});
    });

    it("updates auth flag through setIsAuth", () => {
        const store = new UserGallery();

        store.setIsAuth(true);
        expect(store.isAuth).toBe(true);

        store.setIsAuth(false);
        expect(store.isAuth).toBe(false);
    });

    it("updates the current user through setUser", () => {
        const store = new UserGallery();
        const user = { id: 1, email: "user@example.com", role: "ADMIN" };

        store.setUser(user);

        expect(store.user).toEqual(user);
    });

    it("keeps instances independent of each other", () => {
        const first = new UserGallery();
        const second = new UserGallery();

        first.setIsAuth(true);
        first.setUser({ id: 42 });

        expect(second.isAuth).toBe(false);
        expect(second.user).toEqual({});
    });
});
