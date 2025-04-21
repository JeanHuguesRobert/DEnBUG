const express = require('express');
const { readFile } = require('fs/promises');
const { resolve } = require('path');
const cors = require('cors');

function createApp() {
    const app = express();
    
    app.use(cors());
    
    app.use((req, res, next) => {
        console.log(`${req.method} ${req.path}`);
        next();
    });

    app.get('/test', (req, res) => {
        console.log('Handling /test request');
        res.status(200).send('ok');
    });

    app.get('/source/:file', async (req, res) => {
        try {
            const filePath = resolve(process.cwd(), req.params.file);
            const content = await readFile(filePath, 'utf-8');
            res.type('text/plain').send(content);
        } catch (error) {
            res.status(404).send('File not found');
        }
    });

    app.get('/sourcemap/:file', async (req, res) => {
        try {
            const filePath = resolve(process.cwd(), req.params.file + '.map');
            const content = await readFile(filePath, 'utf-8');
            res.type('application/json').send(content);
        } catch (error) {
            res.status(404).send('Source map not found');
        }
    });

    app.use((err, req, res, next) => {
        console.error('Server error:', err);
        res.status(500).send('Server error');
    });

    return app;
}

const app = createApp();

module.exports = {
    app,
    createApp
};