const ApiError = require('../error/ApiError.js');
const db = require('../../db/index.ts')
const messages = require('../../db/schema.ts');

class MessageController {
    async send(req, res, next) {
        try {
            const out = await db.db.insert(messages.mymessages).values({
                message:req.body['value'],
            })
            res.send(out);
        } catch (e) {
            next(ApiError.badRequest(e.message))
        }
    }

    async recieve(req, res, next) {
        try {
            const data = await db.db
                .select()
                .from(messages.mymessages)
            res.send(data);
            return data
        } catch (e) {
            next(ApiError.badRequest(e.message))
        }
    }

}

module.exports = new MessageController()