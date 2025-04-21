const request = require('supertest');
const { app } = require('../src/index.js');

describe('UI Server Basic Test', () => {
    it('should respond to test endpoint', () => {
        return request(app)
            .get('/test')
            .expect(200)
            .expect('ok');
    });

    it('should serve source files', async () => {
        const testContent = 'test content';
        const testFile = 'test.js';
        await require('fs/promises').writeFile(require('path').resolve(process.cwd(), testFile), testContent);

        const response = await request(app)
            .get(`/source/${testFile}`)
            .expect('Content-Type', /text\/plain/)
            .expect(200);

        expect(response.text).toBe(testContent);
        
        // Cleanup
        await require('fs/promises').unlink(require('path').resolve(process.cwd(), testFile));
    });

    it('should handle missing files', async () => {
        await request(app)
            .get('/source/nonexistent.js')
            .expect(404);
    });
});