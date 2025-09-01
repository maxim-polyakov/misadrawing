const Router = require('express')
const messageRouter = require('./messsageRouter')
const userRouter = require('./userRouter')
const router = new Router()

router.use('/messages', messageRouter)
router.use('/user', userRouter)

module.exports = router