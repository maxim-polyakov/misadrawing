import React, {useContext, useEffect, useState} from 'react';
import {BrowserRouter} from "react-router-dom";
import AppRouter from "./components/AppRouter.js";
import MyNavbar from "./components/MyNavbar.js";
import {observer} from "mobx-react-lite";
import { Context } from "./index.js";

import { check } from "./http/userApi.js";
import { Spinner } from "react-bootstrap";

const App = observer(() => {

    const { user } = useContext(Context);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            setTimeout(() => {
                check()
                    .then((data) => {
                        user?.setUser(data);
                        user?.setIsAuth(true);
                    })
                    .finally(() => setLoading(false));
            }, 1000);
        } catch (e) {
            console.log(e);
        }
    }, []);

    if (loading) {
        return <Spinner animation="grow"></Spinner>;
    }

    return (
        <BrowserRouter>
            <MyNavbar />
            <AppRouter />
        </BrowserRouter>
    );
});

export default App;