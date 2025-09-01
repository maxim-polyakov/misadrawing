import { observer } from "mobx-react-lite";
import './Gallery.css';


const Gallery = observer(() => {
    return (
                <div className="scroll-container" style={{backgroundImage: `url(${process.env.REACT_APP_API_URL}/image.jpg)`}}>
                    <div className="gallery">
                        <img src={`${process.env.REACT_APP_API_URL}/${0}.jpg`} width={300} height={300}
                             alt="описание изображения 0"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${1}.jpg`} width={300} height={300}
                             alt="описание изображения 1"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${2}.jpg`} width={300} height={300}
                             alt="описание изображения 2"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${3}.jpg`} width={300} height={300}
                             alt="описание изображения 3"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${4}.jpg`} width={300} height={300}
                             alt="описание изображения 4"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${5}.jpg`} width={300} height={300}
                             alt="описание изображения 5"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${6}.jpg`} width={300} height={300}
                             alt="описание изображения 6"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${7}.jpg`} width={300} height={300}
                             alt="описание изображения 7"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${8}.jpg`} width={300} height={300}
                             alt="описание изображения 8"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${9}.jpg`} width={300} height={300}
                             alt="описание изображения 9"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${10}.jpg`} width={300} height={300}
                             alt="описание изображения 10"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${11}.jpg`} width={300} height={300}
                             alt="описание изображения 11"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${12}.jpg`} width={300} height={300}
                             alt="описание изображения 12"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${13}.jpg`} width={300} height={300}
                             alt="описание изображения 13"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${14}.jpg`} width={300} height={300}
                             alt="описание изображения 14"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${15}.jpg`} width={300} height={300}
                             alt="описание изображения 15"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${16}.jpg`} width={300} height={300}
                             alt="описание изображения 16"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${17}.jpg`} width={300} height={300}
                             alt="описание изображения 17"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${18}.jpg`} width={300} height={300}
                             alt="описание изображения 18"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${19}.jpg`} width={300} height={300}
                             alt="описание изображения 19"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${20}.jpg`} width={300} height={300}
                             alt="описание изображения 20"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${21}.jpg`} width={300} height={300}
                             alt="описание изображения 21"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${22}.jpg`} width={300} height={300}
                             alt="описание изображения 22"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${23}.jpg`} width={300} height={300}
                             alt="описание изображения 23"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${24}.jpg`} width={300} height={300}
                             alt="описание изображения 24"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${25}.jpg`} width={300} height={300}
                             alt="описание изображения 25"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${26}.jpg`} width={300} height={300}
                             alt="описание изображения 26"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${27}.jpg`} width={300} height={300}
                             alt="описание изображения 27"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${28}.jpg`} width={300} height={300}
                             alt="описание изображения 28"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${29}.jpg`} width={300} height={300}
                             alt="описание изображения 29"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${30}.jpg`} width={300} height={300}
                             alt="описание изображения 30"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${31}.jpg`} width={300} height={300}
                             alt="описание изображения 31"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${32}.jpg`} width={300} height={300}
                             alt="описание изображения 32"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${33}.jpg`} width={300} height={300}
                             alt="описание изображения 33"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${34}.jpg`} width={300} height={300}
                             alt="описание изображения 34"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${35}.jpg`} width={300} height={300}
                             alt="описание изображения 35"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${36}.jpg`} width={300} height={300}
                             alt="описание изображения 36"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${37}.jpg`} width={300} height={300}
                             alt="описание изображения 37"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${38}.jpg`} width={300} height={300}
                             alt="описание изображения 38"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${39}.jpg`} width={300} height={300}
                             alt="описание изображения 39"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${40}.jpg`} width={300} height={300}
                             alt="описание изображения 40"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${41}.jpg`} width={300} height={300}
                             alt="описание изображения 41"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${42}.jpg`} width={300} height={300}
                             alt="описание изображения 42"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${43}.jpg`} width={300} height={300}
                             alt="описание изображения 43"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${44}.jpg`} width={300} height={300}
                             alt="описание изображения 44"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${45}.jpg`} width={300} height={300}
                             alt="описание изображения 45"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${46}.jpg`} width={300} height={300}
                             alt="описание изображения 46"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${47}.jpg`} width={300} height={300}
                             alt="описание изображения 47"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${48}.jpg`} width={300} height={300}
                             alt="описание изображения 48"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${49}.jpg`} width={300} height={300}
                             alt="описание изображения 49"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${50}.jpg`} width={300} height={300}
                             alt="описание изображения 50"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${51}.jpg`} width={300} height={300}
                             alt="описание изображения 51"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${52}.jpg`} width={300} height={300}
                             alt="описание изображения 52"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${53}.jpg`} width={300} height={300}
                             alt="описание изображения 53"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${54}.jpg`} width={300} height={300}
                             alt="описание изображения 54"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${55}.jpg`} width={300} height={300}
                             alt="описание изображения 55"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${56}.jpg`} width={300} height={300}
                             alt="описание изображения 56"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${57}.jpg`} width={300} height={300}
                             alt="описание изображения 57"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${58}.jpg`} width={300} height={300}
                             alt="описание изображения 58"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${59}.jpg`} width={300} height={300}
                             alt="описание изображения 59"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${60}.jpg`} width={300} height={300}
                             alt="описание изображения 60"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${61}.jpg`} width={300} height={300}
                             alt="описание изображения 61"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${62}.jpg`} width={300} height={300}
                             alt="описание изображения 62"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${63}.jpg`} width={300} height={300}
                             alt="описание изображения 63"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${64}.jpg`} width={300} height={300}
                             alt="описание изображения 64"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${65}.jpg`} width={300} height={300}
                             alt="описание изображения 65"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${66}.jpg`} width={300} height={300}
                             alt="описание изображения 66"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${67}.jpg`} width={300} height={300}
                             alt="описание изображения 67"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${68}.jpg`} width={300} height={300}
                             alt="описание изображения 68"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${69}.jpg`} width={300} height={300}
                             alt="описание изображения 69"/>
                        <img src={`${process.env.REACT_APP_API_URL}/${70}.jpg`} width={300} height={300}
                             alt="описание изображения 70"/>
                    </div>
                </div>
    );
});
export default Gallery;