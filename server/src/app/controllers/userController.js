const ApiError = require('../error/ApiError');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const Users = require("../../db/schema.ts");
const db = require('../../db/index.ts')
const {eq} = require("drizzle-orm");

const generateJwt = (id, email, role) => {
    return jwt.sign(
        {id, email, role},
        process.env.SECRET_KEY,
        {expiresIn: '24h'}
    )
}

class UserController {
    async registration(req, res, next) {
        const {email, password, role} = req.body
        if (!email || !password) {
            return next(ApiError.badRequest('Некорректный email или password'))
        }
        const candidate = await db.db
            .select()
            .from(Users.users)
            .where(eq(Users.users.email, email))
        if (candidate.length != 0) {
            return next(ApiError.badRequest('Пользователь с таким email уже существует'))
        }
        const hashPassword = await bcrypt.hash(password, 5)
        const [inserted] = await db.db.insert(Users.users).values({
            email: email,
            role: role || 'USER',
            password: hashPassword
        }).returning()
        const token = generateJwt(inserted.id, inserted.email, inserted.role)
        return res.json({token})
    }

    async login(req, res, next) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return next(ApiError.badRequest('Email и пароль обязательны'));
            }

            const user = await db.db
                .select()
                .from(Users.users)
                .where(eq(Users.users.email, email));

            if (user.length === 0) {
                return next(ApiError.badRequest('Пользователь не найден'));
            }

            const userData = user[0];

            // Пользователи через Google не имеют пароля
            if (!userData.password) {
                return next(ApiError.badRequest('Этот аккаунт привязан к Google. Войдите через Google'));
            }

            const comparePassword = bcrypt.compareSync(password, userData.password);
            if (!comparePassword) {
                return next(ApiError.badRequest('Указан неверный пароль'));
            }

            const token = generateJwt(userData.id, userData.email, userData.role);
            return res.json({ token });

        } catch (error) {
            return next(ApiError.internal('Ошибка при авторизации'));
        }
    }

    async check(req, res, next) {
        const token = generateJwt(req.user.id, req.user.email, req.user.role)
        return res.json({token})
    }

    async googleAuthCallback(req, res, next) {
        try {
            if (!req.user) {
                const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
                return res.redirect(`${clientUrl}/login?error=google_auth_failed`);
            }
            const token = generateJwt(req.user.id, req.user.email, req.user.role);
            const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
            return res.redirect(`${clientUrl}/login?token=${token}`);
        } catch (err) {
            return next(err);
        }
    }
}

module.exports = new UserController()