const Router = require('express')
const router = new Router()
const imageController = require('../controllers/imageController')
const authMiddleware = require('../middleware/authMiddleware')
const checkRoleMiddleware = require('../middleware/checkRoleMiddleware')

router.post('/upload', authMiddleware, checkRoleMiddleware('ADMIN'), imageController.upload)
router.post('/upload-background', authMiddleware, checkRoleMiddleware('ADMIN'), imageController.uploadBackground)
router.get('/', imageController.getAll)

module.exports = router
