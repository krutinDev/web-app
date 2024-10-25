const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;


// Обслуживание статических файлов из папки client
app.use(express.static(path.join(__dirname, 'client')));


// Загружаем "базу данных" ключевых слов и URL из JSON-файла
const keywordsDataPath = path.join(__dirname, 'keywords.json');
let keywordsData = JSON.parse(fs.readFileSync(keywordsDataPath, 'utf8'));


// Мидлвар для обработки JSON-формата
app.use(express.json());


// Эндпоинт для получения всех ключевых слов
app.get('/keywords', (req, res) => {
    res.json(Object.keys(keywordsData));
});


// Эндпоинт для получения URL по ключевому слову
app.post('/urls', (req, res) => {
    const { keyword } = req.body;
    const urls = keywordsData[keyword];
    
    if (urls) {
        res.json(urls);
    } else {
        res.status(404).json({ error: 'Keyword not found' });
    }
});


app.post('/download', async (req, res) => {
    const { url } = req.body;

    try {
        // Инициализируем запрос на скачивание контента
        const response = await axios.get(url, { responseType: 'stream' });
        const totalLength = response.headers['content-length'];

        // Проверяем наличие заголовка Content-Length
        if (totalLength) {
            res.setHeader('Content-Length', totalLength);
        }
        res.setHeader('Content-Type', 'application/octet-stream');

        let downloadedLength = 0;

        // Отслеживаем прогресс загрузки и передаем его клиенту
        response.data.on('data', (chunk) => {
            downloadedLength += chunk.length;
            res.write(chunk);
            if (totalLength) {
                console.log(`Progress: ${(downloadedLength / totalLength * 100).toFixed(2)}%`);
            } else {
                console.log(`Downloaded ${downloadedLength} bytes`);
            }
        });

        response.data.on('end', () => {
            res.end();
        });

    } catch (error) {
        console.error('Error downloading content:', error.message);
        res.status(500).json({ error: 'Failed to download content' });
    }
});


// Запуск сервера
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});