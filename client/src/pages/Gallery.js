import { observer } from "mobx-react-lite";
import './Gallery.css';

const Gallery = observer(() => {
    // Количество изображений
    const totalImages = 71; // от 0 до 70 включительно

    // Создаем массив с номерами изображений
    const imageNumbers = Array.from({ length: totalImages }, (_, i) => i);

    return (
        <div
            className="scroll-container"
            style={{ backgroundImage: `url(${process.env.REACT_APP_API_URL}/image.jpg)` }}
        >
            <div className="gallery">
                {imageNumbers.map((number) => (
                    <img
                        key={number}
                        src={`${process.env.REACT_APP_API_URL}/${number}.jpg`}
                        width={300}
                        height={300}
                        alt={`описание изображения ${number}`}
                        loading="lazy" // Ленивая загрузка для оптимизации
                    />
                ))}
            </div>
        </div>
    );
});

export default Gallery;