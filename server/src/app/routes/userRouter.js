const Router = require('express')
const router = new Router()
const passport = require('../../config/passport')
const userController = require('../controllers/userController')
const authMiddleware = require('../middleware/authMiddleware')

router.post('/registration', userController.registration)
router.post('/login', userController.login)
router.get('/auth', authMiddleware, userController.check)

// Google OAuth — вход без регистрации
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }))
router.get('/auth/google/callback', (req, res, next) => {
    passport.authenticate('google', { session: false }, (err, user, info) => {
        if (err) return next(err)
        if (!user) {
            const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000'
            return res.redirect(`${clientUrl}/login?error=google_auth_failed`)
        }
        req.user = user
        userController.googleAuthCallback(req, res, next)
    })(req, res, next)
})

module.exports = router