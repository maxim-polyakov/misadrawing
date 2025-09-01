import {Context} from "../index.js";
import { useContext } from "react";
import { Route, Routes } from "react-router-dom";
import { authRoutes, publickRoutes } from "../Routes.js";
import { observer } from "mobx-react-lite";
import {Gallery} from "../pages/Gallery.js";

const AppRouter = observer(() => {
    const {user} = useContext(Context)

    let isAuth = user?._isAuth;

    console.log(user)
    return (
        <Routes>
            {isAuth &&
                authRoutes.map(({ path, Component }) => {
                    return (
                        <Route
                            key={path}
                            path={path}
                            Component={Component}
                        ></Route>
                    );
                })}
            {publickRoutes.map(({ path, Component }) => (
                <Route key={path} path={path} Component={Component}></Route>
            ))}
            <Route path="*" element={<Gallery></Gallery>}></Route>
        </Routes>

    );
});

export default AppRouter;