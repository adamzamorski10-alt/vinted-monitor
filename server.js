// server.js - Backend serwer dla Vinted Monitor
// Uruchom: node server.js

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serwuj pliki statyczne

// Endpoint do sprawdzania pojedynczego przedmiotu
app.post('/api/check-item', async (req, res) => {
    try {
        const { url } = req.body;
        
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const $ = cheerio.load(response.data);
        
        // Sprawdzenie czy przedmiot jest sprzedany
        // Vinted używa różnych wskaźników - sprawdzamy wszystkie
        const isSold = 
            $('body').text().toLowerCase().includes('sold') ||
            $('body').text().toLowerCase().includes('sprzedane') ||
            $('.item-box__overlay').length > 0 ||
            $('[data-testid="item-sold-badge"]').length > 0;

        // Pobieramy informacje o przedmiocie
        const title = $('h1.details-list__item-title').text().trim() || 
                     $('[itemprop="name"]').text().trim() ||
                     $('meta[property="og:title"]').attr('content');
        
        const price = $('.details-list__item-price').text().trim() ||
                     $('[itemprop="price"]').text().trim();

        res.json({
            success: true,
            available: !isSold,
            sold: isSold,
            title: title,
            price: price,
            checkedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('Błąd sprawdzania przedmiotu:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Endpoint do sprawdzania przedmiotów użytkownika
app.post('/api/check-user', async (req, res) => {
    try {
        const { url } = req.body;
        
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const $ = cheerio.load(response.data);
        
        // Znajdź wszystkie przedmioty użytkownika
        const items = [];
        
        $('.feed-grid__item, .item-box').each((i, elem) => {
            const itemUrl = $(elem).find('a').attr('href');
            const isSold = $(elem).find('.item-box__overlay').length > 0 ||
                          $(elem).text().toLowerCase().includes('sold');
            
            if (itemUrl) {
                items.push({
                    url: itemUrl.startsWith('http') ? itemUrl : `https://www.vinted.pl${itemUrl}`,
                    sold: isSold,
                    title: $(elem).find('.item-box__title').text().trim()
                });
            }
        });

        res.json({
            success: true,
            items: items,
            checkedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('Błąd sprawdzania użytkownika:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Endpoint testowy
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Vinted Monitor API działa' });
});

app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════╗
║   VINTED MONITOR SERVER URUCHOMIONY   ║
╚═══════════════════════════════════════╝

🚀 Serwer działa na: http://localhost:${PORT}
📱 Aplikacja: http://localhost:${PORT}/vinted-monitor.html

💡 Aby zatrzymać: Ctrl+C
    `);
});
