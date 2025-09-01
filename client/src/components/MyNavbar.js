import { useContext } from "react";
import { Context } from "../index.js";
import Navbar from "react-bootstrap/Navbar";
import { Button, Container, Nav } from "react-bootstrap";
import { Link } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { LOGIN_ROUTE } from "../utils/consts.js";

const MyNavbar = observer(() => {
    const { user } = useContext(Context);

    const logOut = () => {
        user?.setUser({});
        user?.setIsAuth(false);
        localStorage.removeItem("token");
    };

    return (
            <Navbar bg="dark" data-bs-theme="dark">
                <Container>
                    {user?.isAuth ? (
                        <Nav className="ml-auto">
                            <Link to={LOGIN_ROUTE}>
                                <Button
                                    variant="outline-light"
                                    style={{ marginLeft: "0.5rem" }}
                                    onClick={() => logOut()}
                                >
                                    Выйти
                                </Button>
                            </Link>
                        </Nav>
                    ) : (
                        <Nav className="ml-auto">
                            <Link to={LOGIN_ROUTE}>
                                <Button variant="outline-light">
                                    Авторизация
                                </Button>
                            </Link>
                        </Nav>
                    )}
                </Container>
            </Navbar>
    );
});

export default MyNavbar;