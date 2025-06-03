// server.js
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Aktifkan CORS agar frontend bisa akses
app.use(cors());

// Endpoint proxy ke API downloader
app.get('/api/download', async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) {
        return res.status(400).json({ error: 'Parameter URL tidak ditemukan' });
    }

    try {
        const apiUrl = `https://r-nozawa.hf.space/aio?url=${encodeURIComponent(targetUrl)}`;
        const response = await fetch(apiUrl);
        const data = await response.json();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Gagal memproses permintaan', detail: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server proxy berjalan di http://localhost:${PORT}`);
});