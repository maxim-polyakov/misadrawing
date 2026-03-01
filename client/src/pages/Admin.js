import { observer } from "mobx-react-lite";
import { useContext, useState, useRef } from "react";
import { Button, Card, Container, Alert } from "react-bootstrap";
import { Link } from "react-router-dom";
import { Context } from "../index.js";
import { uploadImage, uploadBackground } from "../http/imageApi.js";
import { GALLERY_ROUTE } from "../utils/consts.js";

const Admin = observer(() => {
    const { user } = useContext(Context);
    const [imageUploading, setImageUploading] = useState(false);
    const [bgUploading, setBgUploading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });
    const imageInputRef = useRef(null);
    const bgInputRef = useRef(null);

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !file.type.startsWith("image/")) return;
        setImageUploading(true);
        setMessage({ type: "", text: "" });
        try {
            await uploadImage(file);
            setMessage({ type: "success", text: "Картинка загружена" });
        } catch (err) {
            setMessage({ type: "danger", text: err.response?.data?.message || err.message || "Ошибка загрузки" });
        } finally {
            setImageUploading(false);
            e.target.value = "";
        }
    };

    const handleBackgroundUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !file.type.startsWith("image/")) return;
        setBgUploading(true);
        setMessage({ type: "", text: "" });
        try {
            await uploadBackground(file);
            setMessage({ type: "success", text: "Фоновое изображение загружено" });
        } catch (err) {
            setMessage({ type: "danger", text: err.response?.data?.message || err.message || "Ошибка загрузки" });
        } finally {
            setBgUploading(false);
            e.target.value = "";
        }
    };

    if (!user?.isAuth || user?.user?.role !== "ADMIN") {
        return (
            <Container className="py-5">
                <Alert variant="danger">Доступ запрещён</Alert>
                <Link to={GALLERY_ROUTE}>Вернуться в галерею</Link>
            </Container>
        );
    }

    return (
        <Container className="py-4">
            <h2 className="mb-4">Кабинет администратора</h2>

            {message.text && (
                <Alert variant={message.type} dismissible onClose={() => setMessage({ type: "", text: "" })}>
                    {message.text}
                </Alert>
            )}

            <div className="d-flex flex-column gap-4">
                <Card>
                    <Card.Header>Загрузка картинок в галерею</Card.Header>
                    <Card.Body>
                        <input
                            ref={imageInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            style={{ display: "none" }}
                        />
                        <Button
                            variant="primary"
                            onClick={() => imageInputRef.current?.click()}
                            disabled={imageUploading}
                        >
                            {imageUploading ? "Загрузка..." : "Выбрать и загрузить картинку"}
                        </Button>
                    </Card.Body>
                </Card>

                <Card>
                    <Card.Header>Фоновое изображение</Card.Header>
                    <Card.Body>
                        <p className="text-muted small mb-2">
                            Загрузите изображение для фона галереи (JPEG, PNG, GIF, WebP)
                        </p>
                        <input
                            ref={bgInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleBackgroundUpload}
                            style={{ display: "none" }}
                        />
                        <Button
                            variant="secondary"
                            onClick={() => bgInputRef.current?.click()}
                            disabled={bgUploading}
                        >
                            {bgUploading ? "Загрузка..." : "Загрузить фоновое изображение"}
                        </Button>
                    </Card.Body>
                </Card>
            </div>

            <Link to={GALLERY_ROUTE} className="mt-4 d-inline-block">
                ← Вернуться в галерею
            </Link>
        </Container>
    );
});

export default Admin;
