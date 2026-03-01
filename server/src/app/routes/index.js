const Router = require('express')
const userRouter = require('./userRouter')
const imageRouter = require('./imageRouter')
const router = new Router()

router.use('/user', userRouter)
router.use('/images', imageRouter)

module.exports = router