const ApiError = require('../error/ApiError')
const fs = require('fs')
const { uploadImage, uploadBackground, deleteFromS3 } = require('../../services/s3Service')
const db = require('../../db/index.ts')
const Users = require('../../db/schema.ts')
const { eq } = require('drizzle-orm')

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

function getFileBuffer(file) {
    if (file.data && file.data.length > 0) return file.data
    if (file.tempFilePath) return fs.readFileSync(file.tempFilePath)
    throw new Error('Нет данных файла')
}

class ImageController {
    async upload(req, res, next) {
        try {
            console.log('[upload] Запрос получен, files:', req.files ? Object.keys(req.files) : 'нет')
            if (!req.files?.image) {
                return next(ApiError.badRequest('Файл image обязателен'))
            }

            const file = req.files.image
            if (file.truncated) {
                return next(ApiError.badRequest('Файл слишком большой. Максимум 50 МБ'))
            }
            if (!ALLOWED_TYPES.includes(file.mimetype)) {
                return next(ApiError.badRequest('Допустимые форматы: JPEG, PNG, GIF, WebP'))
            }

            const buffer = getFileBuffer(file)
            const url = await uploadImage(buffer, file.name, file.mimetype)

            const userId = req.user?.id || null
            const [inserted] = await db.db
                .insert(Users.images)
                .values({ url, userId })
                .returning()

            console.log('[upload] Успех, url:', url)
            return res.json({ id: inserted.id, url })
        } catch (e) {
            console.error('[upload] Ошибка:', e.message, e.stack)
            return next(ApiError.internal(e.message))
        }
    }

    async uploadBackground(req, res, next) {
        try {
            console.log('[uploadBackground] Запрос получен, files:', req.files ? Object.keys(req.files) : 'нет')
            if (!req.files?.image) {
                return next(ApiError.badRequest('Файл image обязателен'))
            }
            const file = req.files.image
            if (file.truncated) {
                return next(ApiError.badRequest('Файл слишком большой. Максимум 50 МБ'))
            }
            if (!ALLOWED_TYPES.includes(file.mimetype)) {
                return next(ApiError.badRequest('Допустимые форматы: JPEG, PNG, GIF, WebP'))
            }
            const buffer = getFileBuffer(file)
            const url = await uploadBackground(buffer, file.mimetype)
            console.log('[uploadBackground] Успех, url:', url)
            return res.json({ url })
        } catch (e) {
            console.error('[uploadBackground] Ошибка:', e.message, e.stack)
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

    async delete(req, res, next) {
        try {
            const id = parseInt(req.params.id, 10)
            if (isNaN(id)) return next(ApiError.badRequest('Некорректный ID'))
            const rows = await db.db.select().from(Users.images).where(eq(Users.images.id, id))
            if (rows.length === 0) return next(ApiError.notFound('Изображение не найдено'))
            const url = rows[0].url
            await deleteFromS3(url)
            await db.db.delete(Users.images).where(eq(Users.images.id, id))
            return res.json({ success: true })
        } catch (e) {
            console.error('[delete] Ошибка:', e.message, e.stack)
            return next(ApiError.internal(e.message))
        }
    }
}

module.exports = new ImageController()
