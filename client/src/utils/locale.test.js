import { getLanguage, setLanguage, withLangQuery } from "./locale";

describe("gallery locale URLs", () => {
    beforeEach(() => {
        localStorage.clear();
        window.history.replaceState({}, "", "/gallery");
    });

    test("adds language and Discord preview version to links", () => {
        expect(withLangQuery("/gallery", "ru")).toBe("/gallery?lang=ru&v=2");
        expect(withLangQuery("/login?next=gallery", "en"))
            .toBe("/login?next=gallery&lang=en&v=2");
    });

    test("reads language from URL and keeps it when switching", () => {
        window.history.replaceState({}, "", "/gallery?lang=ru&v=2");
        expect(getLanguage()).toBe("ru");

        setLanguage("en");

        expect(window.location.pathname).toBe("/gallery");
        expect(window.location.search).toBe("?lang=en&v=2");
        expect(document.documentElement.lang).toBe("en");
        expect(document.title).toBe("Misa Gallery");
    });

    test("uses the full Misa language pack", () => {
        window.history.replaceState({}, "", "/login?lang=de&v=2");
        expect(getLanguage()).toBe("de");
        setLanguage("de");
        expect(document.title).toBe("Misa Galerie");
    });
});
