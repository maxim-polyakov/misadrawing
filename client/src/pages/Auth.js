import { useContext, useState } from "react";
import { Button, Card, Container, Form } from "react-bootstrap";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LOGIN_ROUTE, REGISTRATION_ROUTE } from "../utils/consts.js";
import { login, registration } from "../http/userApi.js";
import { observer } from "mobx-react-lite";
import { Context } from "../index.js";

export const Auth = observer(() => {
    const { user } = useContext(Context);
    const location = useLocation();
    const isLogin = location.pathname === LOGIN_ROUTE && true;
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const swapMethod = () => {
        setEmail("");
        setPassword("");
    };

    const signIn = async () => {
        try {
            let data;
            if (isLogin) {
                data = await login(email, password);

                navigate("/");
            } else {
                data = await registration(email, password);

                navigate("/");
            }

            user?.setUser(user);
            user?.setIsAuth(true);

            setEmail("");
            setPassword("");
        } catch (error) {
            console.log(error.response.data);
        }
    };

    return isLogin ? (
        <Container
            className="d-flex justify-content-center align-items-center"
            style={{ height: window.innerHeight - 54 }}
        >
            <Card style={{ width: 700 }} className="p-5">
                <h2 className="m-auto">Авторизация</h2>
                <Form className="d-flex flex-column">
                    <Form.Control
                        className="mt-3"
                        placeholder="Введите email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    ></Form.Control>
                    <Form.Control
                        className="mt-2"
                        placeholder="Введите пароль"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        type="password"
                    ></Form.Control>
                    <div className="d-flex justify-content-between mt-3 pl-3 pr-3 falign-items-center">
                        <div>
                            Нет аккаунта?
                            <Link
                                to={REGISTRATION_ROUTE}
                                style={{ textDecoration: "none" }}
                                onClick={() => swapMethod()}
                            >
                                {" "}
                                Регистрация
                            </Link>
                        </div>
                        <Button
                            variant="outline-success"
                            onClick={() => signIn()}
                        >
                            Войти
                        </Button>
                    </div>
                </Form>
            </Card>
        </Container>
    ) : (
        <Container
            className="d-flex justify-content-center align-items-center"
            style={{ height: window.innerHeight - 54 }}
        >
            <Card style={{ width: 600 }} className="p-5">
                <h2 className="m-auto">Регистрация</h2>
                <Form className="d-flex flex-column">
                    <Form.Control
                        className="mt-3"
                        placeholder="Введите email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    ></Form.Control>
                    <Form.Control
                        className="mt-2"
                        placeholder="Введите пароль"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    ></Form.Control>
                    <div className="d-flex justify-content-between mt-3 pl-3 pr-3 falign-items-center">
                        <div>
                            Уже есть аккаунт?
                            <Link
                                to={LOGIN_ROUTE}
                                style={{ textDecoration: "none" }}
                                onClick={() => swapMethod()}
                            >
                                {" "}
                                Войти
                            </Link>
                        </div>
                        <Button
                            variant="outline-success"
                            onClick={() => signIn()}
                        >
                            Зарегистрироваться
                        </Button>
                    </div>
                </Form>
            </Card>
        </Container>
    );
});
