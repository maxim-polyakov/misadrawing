const ApiError = require('../error/ApiError')
const { uploadImage, uploadBackground } = require('../../services/s3Service')
const db = require('../../db/index.ts')
const Users = require('../../db/schema.ts')

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

class ImageController {
    async upload(req, res, next) {
        try {
            if (!req.files?.image) {
                return next(ApiError.badRequest('Файл image обязателен'))
            }

            const file = req.files.image
            if (!ALLOWED_TYPES.includes(file.mimetype)) {
                return next(ApiError.badRequest('Допустимые форматы: JPEG, PNG, GIF, WebP'))
            }

            const url = await uploadImage(file.data, file.name, file.mimetype)

            const userId = req.user?.id || null
            const [inserted] = await db.db
                .insert(Users.images)
                .values({ url, userId })
                .returning()

            return res.json({ id: inserted.id, url })
        } catch (e) {
            return next(ApiError.internal(e.message))
        }
    }

    async uploadBackground(req, res, next) {
        try {
            if (!req.files?.image) {
                return next(ApiError.badRequest('Файл image обязателен'))
            }
            const file = req.files.image
            if (!ALLOWED_TYPES.includes(file.mimetype)) {
                return next(ApiError.badRequest('Допустимые форматы: JPEG, PNG, GIF, WebP'))
            }
            const url = await uploadBackground(file.data, file.mimetype)
            return res.json({ url })
        } catch (e) {
            return next(ApiError.internal(e.message))
        }
    }

    async getAll(req, res, next) {
        try {
            const rows = await db.db.select().from(Users.images)
            const backgroundUrl = process.env.S3__BackgroundUrl || `${process.env.S3__PublicBaseUrl}/background.jpg`
            return res.json({
                images: rows.map((r) => ({ id: r.id, url: r.url })),
                backgroundUrl,
            })
        } catch (e) {
            return next(ApiError.internal(e.message))
        }
    }
}

module.exports = new ImageController()
