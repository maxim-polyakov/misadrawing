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
        const user = await db.db.insert(Users.users).values({
            email: email,
            role: role,
            password: hashPassword
        })
        const token = generateJwt(user.id, user.email, user.role)
        return res.json({token})
    }

    async login(req, res, next) {
        try {
            const { email, password } = req.body;

            // Проверяем, что email и password переданы
            if (!email || !password) {
                return next(ApiError.badRequest('Email и пароль обязательны'));
            }

            const user = await db.db
                .select()
                .from(Users.users)
                .where(eq(Users.users.email, email));

            // Проверяем длину массива, а не сам массив
            if (user.length === 0) {
                return next(ApiError.badRequest('Пользователь не найден'));
            }

            const userData = user[0]; // Берем первого пользователя из массива

            // Проверяем пароль
            let comparePassword = bcrypt.compareSync(password, userData.password);
            if (!comparePassword) {
                return next(ApiError.badRequest('Указан неверный пароль'));
            }

            // Генерируем токен
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
}

module.exports = new UserController()