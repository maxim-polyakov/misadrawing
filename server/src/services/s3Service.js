const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3')
const crypto = require('crypto')
const path = require('path')

const s3Client = new S3Client({
    endpoint: process.env.S3__ServiceUrl,
    region: 'ru-central1',
    credentials: {
        accessKeyId: process.env.S3__AccessKeyId,
        secretAccessKey: process.env.S3__SecretAccessKey,
    },
    forcePathStyle: true,
})

const BUCKET = process.env.S3__Bucket
const PUBLIC_BASE_URL = process.env.S3__PublicBaseUrl || `${process.env.S3__ServiceUrl}/${process.env.S3__Bucket}`

/**
 * Загружает файл в S3 и возвращает публичный URL
 * @param {Buffer} buffer - содержимое файла
 * @param {string} originalName - оригинальное имя файла
 * @param {string} mimeType - MIME тип (image/jpeg, image/png и т.д.)
 * @returns {Promise<string>} - публичный URL загруженного файла
 */
async function uploadImage(buffer, originalName, mimeType) {
    const ext = path.extname(originalName) || '.jpg'
    const key = `images/${crypto.randomUUID()}${ext}`

    await s3Client.send(
        new PutObjectCommand({
            Bucket: BUCKET,
            Key: key,
            Body: buffer,
            ContentType: mimeType,
            ACL: 'public-read',
        })
    )

    return `${PUBLIC_BASE_URL}/${key}`
}

/**
 * Загружает фоновое изображение в S3 (background.jpg в корне бакета)
 */
async function uploadBackground(buffer, mimeType) {
    const key = 'background.jpg'

    await s3Client.send(
        new PutObjectCommand({
            Bucket: BUCKET,
            Key: key,
            Body: buffer,
            ContentType: mimeType,
            ACL: 'public-read',
        })
    )

    return `${PUBLIC_BASE_URL}/${key}`
}

/**
 * Удаляет файл из S3 по URL
 * @param {string} url - полный URL объекта (например https://storage.../bucket/images/uuid.jpg)
 */
async function deleteFromS3(url) {
    const baseUrl = PUBLIC_BASE_URL.replace(/\/$/, '') + '/'
    const key = url.startsWith(baseUrl) ? url.slice(baseUrl.length) : url.replace(/^.*\/[^/]+\//, '')
    if (!key) throw new Error('Не удалось извлечь ключ из URL')
    await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
}

module.exports = { uploadImage, uploadBackground, deleteFromS3 }
