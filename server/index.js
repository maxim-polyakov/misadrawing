require('dotenv').config()
const express = require('express')
const router = require('./src/app/routes/index.js')
const PORT = process.env.PORT || 5000
const cors = require('cors')
const fileUpload = require('express-fileupload')
const path = require("path");
const app = express()
const corsOptions = {
    origin: 'https://misagallery.baxic.ru', // Укажите точный адрес клиента
};

app.use(express.json());
app.use(express.static(path.resolve(__dirname, './src/static')))
app.use(cors(corsOptions));
app.use(fileUpload({}))
app.use('/api', router)

const start = async () => {
    try {
        app.listen(PORT,'0.0.0.0', () => console.log(`Server started on port ${PORT}`))
    } catch (e) {
        console.log(e)
    }
}

start()
