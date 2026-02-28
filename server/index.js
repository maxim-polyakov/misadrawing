require('dotenv').config()
const express = require('express')
const passport = require('./src/config/passport.js')
const router = require('./src/app/routes/index.js')
const PORT = process.env.PORT || 5000
const cors = require('cors')
const fileUpload = require('express-fileupload')
const path = require("path");
const app = express()

app.use(express.json());
app.use(passport.initialize());
app.use(express.static(path.resolve(__dirname, './src/static')))
app.use(cors());
app.use(fileUpload({}))
app.use('/api', router)

const start = async () => {
    try {
        const { migrate } = await import('drizzle-orm/neon-http/migrator')
        const { db } = await import('./src/db/index.ts')
        await migrate(db, { migrationsFolder: 'src/db/migrations' })
        console.log('Migrations completed')

        app.listen(PORT, '0.0.0.0', () => console.log(`Server started on port ${PORT}`))
    } catch (e) {
        console.log(e)
    }
}

start()
