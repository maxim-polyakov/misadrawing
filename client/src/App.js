import React, { useContext, useEffect, useState } from 'react';
import { BrowserRouter } from "react-router-dom";
import AppRouter from "./components/AppRouter.js";
import MyNavbar from "./components/MyNavbar.js";
import { observer } from "mobx-react-lite";
import { Context } from "./index.js";
import { check } from "./http/userApi.js";
import { Spinner, Container } from "react-bootstrap";

const App = observer(() => {
    const { user } = useContext(Context);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const userData = await check();
                if (userData) {
                    user.setUser(userData);
                    user.setIsAuth(true);
                } else {
                    user.setIsAuth(false);
                    user.setUser({});
                }
            } catch (error) {
                console.log("Auth check error:", error.message);
                user.setIsAuth(false);
                user.setUser({});
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, [user]);

    if (loading) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
                <Spinner animation="border" variant="primary" />
            </Container>
        );
    }

    return (
        <BrowserRouter>
            <MyNavbar />
            <AppRouter />
        </BrowserRouter>
    );
});

export default App;