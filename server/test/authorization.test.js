const assert = require('node:assert/strict')
const { afterEach, test } = require('node:test')
const jwt = require('jsonwebtoken')

const requireRole = require('../src/app/middleware/checkRoleMiddleware')

const originalSecret = process.env.SECRET_KEY

afterEach(() => {
    if (originalSecret === undefined) {
        delete process.env.SECRET_KEY
    } else {
        process.env.SECRET_KEY = originalSecret
    }
})

function createResponse() {
    return {
        statusCode: undefined,
        body: undefined,
        status(code) {
            this.statusCode = code
            return this
        },
        json(body) {
            this.body = body
            return this
        },
    }
}

test('role middleware accepts a signed token with the required role', () => {
    process.env.SECRET_KEY = 'isolated-test-secret'
    const token = jwt.sign({ id: 7, role: 'ADMIN' }, process.env.SECRET_KEY)
    const req = { method: 'GET', headers: { authorization: `Bearer ${token}` } }
    const res = createResponse()
    let nextCalls = 0

    requireRole('ADMIN')(req, res, () => { nextCalls += 1 })

    assert.equal(nextCalls, 1)
    assert.equal(req.user.id, 7)
    assert.equal(res.statusCode, undefined)
})

test('role middleware rejects a valid token for a different role', () => {
    process.env.SECRET_KEY = 'isolated-test-secret'
    const token = jwt.sign({ id: 8, role: 'USER' }, process.env.SECRET_KEY)
    const req = { method: 'GET', headers: { authorization: `Bearer ${token}` } }
    const res = createResponse()
    let nextCalls = 0

    requireRole('ADMIN')(req, res, () => { nextCalls += 1 })

    assert.equal(nextCalls, 0)
    assert.equal(res.statusCode, 403)
    assert.deepEqual(res.body, { message: 'Нет доступа' })
})
