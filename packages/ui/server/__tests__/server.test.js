const request = require('supertest');
const { app } = require('../../../src/server/src/index.js');

describe('UI Server Basic Test', () => {
    it('should respond to test endpoint', () => {
        return request(app)
            .get('/test')
            .expect(200)
            .expect('ok');
    });
});