require('dotenv').config()
const express = require('express')
const os = require('os')
const passport = require('./src/config/passport.js')
const router = require('./src/app/routes/index.js')
const PORT = process.env.PORT || 5000
const cors = require('cors')
const fileUpload = require('express-fileupload')
const app = express()

app.use(express.json({ limit: '10mb' }));
app.use(passport.initialize());
app.use(cors());
app.use(fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 },
    useTempFiles: true,
    tempFileDir: os.tmpdir(),
    uploadTimeout: 120000,
    abortOnLimit: true,
    responseOnLimit: 'Размер файла превышает 50 МБ',
}))
app.use((req, res, next) => {
    if (req.path.startsWith('/api/images') && req.method === 'POST') {
        console.log(`[${new Date().toISOString()}] POST ${req.path} - Content-Length: ${req.headers['content-length'] || '?'}`)
    }
    next()
})
app.use('/api', router)

const start = async () => {
    try {
        const { runMigrations } = require('./src/db/migratePg.js')
        await runMigrations()

        app.listen(PORT, '0.0.0.0', () => console.log(`Server started on port ${PORT}`))
    } catch (e) {
        console.error(e)
        process.exit(1)
    }
}

start()
