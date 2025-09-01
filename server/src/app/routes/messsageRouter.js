const Router = require('express')
const router = new Router()
const messageController = require('../controllers/messageController')

router.post('/', messageController.send)
router.get('/', messageController.recieve)

module.exports = router