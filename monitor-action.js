const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');

// Konfiguracja zmiennych środowiskowych (GitHub Secrets)
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const ITEMS_FILE = 'items.json';

// Diagnostyka (DEBUG)
console.log('--- DIAGNOSTYKA ZMIENNYCH ---');
console.log(`TELEGRAM_TOKEN status: ${TELEGRAM_TOKEN ? 'OK (Załadowano)' : 'BRAK (Undefined/Empty)'}`);
console.log(`CHAT_ID status:        ${CHAT_ID ? 'OK (Załadowano)' : 'BRAK (Undefined/Empty)'}`);
console.log('-----------------------------');

if (!TELEGRAM_TOKEN || !CHAT_ID) {
    console.error('❌ BŁĄD KONFIGURACJI:');
    if (!TELEGRAM_TOKEN) console.error('   -> Brak sekretu TELEGRAM_TOKEN');
    if (!CHAT_ID) console.error('   -> Brak sekretu CHAT_ID');
    console.error('   Upewnij się, że dodałeś je w Settings -> Secrets and variables -> Actions');
    process.exit(1);
}

async function sendTelegramMessage(message) {
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    try {
        await axios.post(url, {
            chat_id: CHAT_ID,
            text: message,
            parse_mode: 'HTML'
        });
        console.log('Wysłano powiadomienie Telegram');
    } catch (error) {
        console.error('Błąd wysyłania Telegram:', error.message);
    }
}

// Funkcja pomocnicza do formatowania czasu trwania
function formatDuration(ms) {
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days} dni, ${hours} godz.`;
    if (hours > 0) return `${hours} godz. ${minutes} min.`;
    return `${minutes} min.`;
}

async function checkUrl(url, type) {
    console.log(`Sprawdzanie: ${url}`);
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7'
            }
        });

        const $ = cheerio.load(response.data);

        // Pobieranie metadanych (Tytuł i Cena)
        let title = $('meta[property="og:title"]').attr('content') || $('h1').first().text().trim() || 'Nieznana nazwa';
        let price = $('[data-testid="item-price"]').text().trim() || $('meta[property="product:price:amount"]').attr('content') || '?? zł';

        // Czyszczenie tytułu (Vinted często dodaje "Vinted" na końcu w meta tagach)
        title = title.replace(' - Vinted', '');

        if (type === 'user') {
            // Logika dla użytkownika - Zwracamy MAPĘ przedmiotów (URL -> Dane)
            let currentInventory = {};

            $('.feed-grid__item, .item-box').each((i, elem) => {
                const isSold = $(elem).find('.item-box__overlay').length > 0 ||
                    $(elem).text().toLowerCase().includes('sold');

                if (!isSold) {
                    let itemUrl = $(elem).find('a').attr('href');
                    if (itemUrl) {
                        if (!itemUrl.startsWith('http')) {
                            const baseUrl = new URL(url).origin;
                            itemUrl = `${baseUrl}${itemUrl}`;
                        }

                        const itemTitle = $(elem).find('.item-box__title').text().trim() || $(elem).find('img').attr('alt') || 'Przedmiot bez nazwy';
                        const itemPrice = $(elem).find('.item-box__title-content, .item-box__price').text().trim() || 'Cena nieznana';

                        currentInventory[itemUrl] = {
                            title: itemTitle,
                            price: itemPrice
                        };
                    }
                }
            });

            return {
                status: currentInventory,
                title: title || 'Profil Użytkownika',
                price: '-'
            };
        } else {
            // Logika dla pojedynczego przedmiotu
            const isSold =
                $('body').text().toLowerCase().includes('sold') ||
                $('body').text().toLowerCase().includes('sprzedane') ||
                $('.item-box__overlay').length > 0 ||
                $('[data-testid="item-sold-badge"]').length > 0;

            return {
                status: !isSold, // true = dostępny, false = sprzedany
                title: title,
                price: price
            };
        }
    } catch (error) {
        console.error(`Błąd pobierania ${url}:`, error.message);
        if (error.response && error.response.status === 404) {
            // Przedmiot usunięty = traktujemy jako niedostępny
            return {
                status: (type === 'user' ? {} : false),
                title: 'Usunięty/Nieznany (404)',
                price: '-'
            };
        }
        return null; // Błąd sieci/blokada - nie zmieniaj statusu
    }
}

async function run() {
    // 1. Wczytaj bazę danych
    let items = [];
    try {
        const data = fs.readFileSync(ITEMS_FILE, 'utf8');
        items = JSON.parse(data);
    } catch (err) {
        console.log('Nie znaleziono pliku items.json lub błąd parsowania.');
        return;
    }

    let dataChanged = false;

    // 2. Iteruj po przedmiotach
    for (const item of items) {
        const result = await checkUrl(item.url, item.type);

        if (result === null) continue; // Pomiń przy błędzie

        const currentStatus = result.status;

        // Obliczanie czasu sprzedaży
        let timeToSell = "Nieznany (brak daty dodania)";
        if (item.addedAt) {
            const addedDate = new Date(item.addedAt);
            const now = new Date();
            const diff = now - addedDate;
            timeToSell = formatDuration(diff);
        } else {
            // Jeśli nie ma daty dodania, dodaj ją teraz, żeby przyszłe kalkulacje działały
            item.addedAt = new Date().toISOString();
            dataChanged = true;
        }

        const dateNow = new Date().toLocaleDateString('pl-PL');
        const timeNow = new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });

        // Logika dla UŻYTKOWNIKA (liczenie przedmiotów)
        if (item.type === 'user') {
            // Pierwsze uruchomienie po zmianie kodu (lub nowy użytkownik)
            // Inicjalizujemy bazę przedmiotów
            if (!item.lastStatus || typeof item.lastStatus !== 'object') {
                // Dodajemy datę wykrycia do każdego przedmiotu
                const inventoryWithDates = {};
                for (const [url, data] of Object.entries(currentStatus)) {
                    inventoryWithDates[url] = { ...data, firstSeen: new Date().toISOString() };
                }
                item.lastStatus = inventoryWithDates;
                dataChanged = true;
                continue;
            }

            const previousInventory = item.lastStatus;
            const newInventoryWithDates = { ...previousInventory }; // Kopia starego stanu

            const displayTitle = item.name || result.title;

            // 1. Sprawdzamy co ZNIKNĘŁO (SPRZEDAŻ)
            for (const [url, oldData] of Object.entries(previousInventory)) {
                if (!currentStatus[url]) {
                    // Przedmiot był, a teraz go nie ma w currentStatus -> SPRZEDANY
                    dataChanged = true;
                    delete newInventoryWithDates[url]; // Usuwamy z bazy

                    // Obliczanie czasu sprzedaży
                    let sellDuration = "Nieznany (przed zmianą systemu)";
                    if (oldData.firstSeen) {
                        const seenDate = new Date(oldData.firstSeen);
                        const diff = new Date() - seenDate;
                        sellDuration = formatDuration(diff);
                    }

                    const msg = `📉 <b>SPRZEDANO PRZEDMIOT!</b>\n\n` +
                        `👤 <b>Użytkownik:</b> ${displayTitle}\n` +
                        `📦 <b>Nazwa:</b> ${oldData.title}\n` +
                        `� <b>Cena:</b> ${oldData.price}\n` +
                        `⏱ <b>Czas sprzedaży:</b> ${sellDuration}\n` +
                        `📅 <b>Data:</b> ${dateNow} ${timeNow}\n\n` +
                        `🔗 <a href="${item.url}">Profil użytkownika</a>`;
                    await sendTelegramMessage(msg);
                }
            }

            // 2. Sprawdzamy co PRZYBYŁO (NOWE)
            for (const [url, newData] of Object.entries(currentStatus)) {
                if (!previousInventory[url]) {
                    // Jest nowy przedmiot
                    dataChanged = true;
                    newInventoryWithDates[url] = { ...newData, firstSeen: new Date().toISOString() };

                    const msg = `🆕 <b>NOWY PRZEDMIOT!</b>\n\n` +
                        `👤 <b>Użytkownik:</b> ${displayTitle}\n` +
                        `📦 <b>Nazwa:</b> ${newData.title}\n` +
                        `💰 <b>Cena:</b> ${newData.price}\n` +
                        `📅 <b>Data:</b> ${dateNow} ${timeNow}\n\n` +
                        `🔗 <a href="${url}">Zobacz przedmiot</a>`;
                    await sendTelegramMessage(msg);
                }
            }

            item.lastStatus = newInventoryWithDates;
        }
        // Logika dla POJEDYNCZEGO PRZEDMIOTU (true/false)
        else {
            if (item.lastStatus !== currentStatus) {
                dataChanged = true;

                if (item.lastStatus === true && currentStatus === false) {
                    const msg = `💸 <b>SPRZEDANO!</b>\n\n` +
                        `📦 <b>Nazwa:</b> ${result.title}\n` +
                        `💰 <b>Cena:</b> ${result.price}\n` +
                        `⏱ <b>Czas sprzedaży:</b> ${timeToSell}\n` +
                        `📅 <b>Data:</b> ${dateNow} ${timeNow}\n\n` +
                        `🔗 <a href="${item.url}">Zobacz przedmiot</a>`;
                    await sendTelegramMessage(msg);
                } else if (item.lastStatus === false && currentStatus === true) {
                    const msg = `🔄 <b>PONOWNIE DOSTĘPNE!</b>\n\n` +
                        `📦 <b>Nazwa:</b> ${result.title}\n` +
                        `💰 <b>Cena:</b> ${result.price}\n\n` +
                        `🔗 <a href="${item.url}">Zobacz przedmiot</a>`;
                    await sendTelegramMessage(msg);
                }
                item.lastStatus = currentStatus;
            }
        }

        // Małe opóźnienie żeby nie bombardować serwera
        await new Promise(r => setTimeout(r, 2000));
    }

    // 3. Zapisz zmiany
    if (dataChanged) {
        fs.writeFileSync(ITEMS_FILE, JSON.stringify(items, null, 2));
        console.log('Zaktualizowano items.json');
    } else {
        console.log('Brak zmian w statusach.');
    }
}

run();