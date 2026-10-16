import { useContext } from "react";
import { Context } from "../index.js";
import Navbar from "react-bootstrap/Navbar";
import { Button, Container, Nav } from "react-bootstrap";
import { Link } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { LOGIN_ROUTE, ADMIN_ROUTE, GALLERY_ROUTE } from "../utils/consts.js";
import { LANGUAGES, useLanguage, withLangQuery } from "../utils/locale.js";

const MyNavbar = observer(() => {
    const { user } = useContext(Context);
    const { language, setLanguage, t } = useLanguage();

    const logOut = () => {
        user?.setUser({});
        user?.setIsAuth(false);
        localStorage.removeItem("token");
    };

    return (
            <Navbar bg="dark" data-bs-theme="dark">
                <Container>
                    <Navbar.Brand href={withLangQuery(GALLERY_ROUTE, language)}>
                        Misa Gallery
                    </Navbar.Brand>
                    {user?.isAuth ? (
                        <Nav className="ml-auto d-flex align-items-center gap-2">
                            <Link to={withLangQuery(GALLERY_ROUTE, language)}>
                                <Button variant="outline-light" size="sm">
                                    {t("gallery")}
                                </Button>
                            </Link>
                            {user?.user?.role === "ADMIN" && (
                                <Link to={withLangQuery(ADMIN_ROUTE, language)}>
                                    <Button variant="outline-info" size="sm">
                                        {t("admin")}
                                    </Button>
                                </Link>
                            )}
                            <Link to={withLangQuery(LOGIN_ROUTE, language)}>
                                <Button
                                    variant="outline-light"
                                    onClick={() => logOut()}
                                >
                                    {t("logout")}
                                </Button>
                            </Link>
                        </Nav>
                    ) : (
                        <Nav className="ml-auto">
                            <Link to={withLangQuery(LOGIN_ROUTE, language)}>
                                <Button variant="outline-light">
                                    {t("authorization")}
                                </Button>
                            </Link>
                        </Nav>
                    )}
                    <select
                        className="gallery-language-select ml-3"
                        aria-label="Language"
                        value={language}
                        onChange={(event) => setLanguage(event.target.value)}
                    >
                        {LANGUAGES.map(({ code, label }) => (
                            <option key={code} value={code}>{label}</option>
                        ))}
                    </select>
                </Container>
            </Navbar>
    );
});

export default MyNavbar;