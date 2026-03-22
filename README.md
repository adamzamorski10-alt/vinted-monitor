# 🔔 Vinted Monitor - Instrukcja Instalacji i Użytkowania

Monitor sprzedaży na Vinted z powiadomieniami przez Telegram.

## 📋 Wymagania

- Node.js (wersja 16 lub nowsza) - [Pobierz tutaj](https://nodejs.org/)
- Przeglądarka internetowa
- Konto Telegram

---

## 🚀 Instalacja

### Krok 1: Pobierz pliki projektu

Zapisz wszystkie pliki w jednym folderze:
- `vinted-monitor.html`
- `server.js`
- `package.json`

### Krok 2: Zainstaluj zależności

Otwórz terminal/wiersz polecenia w folderze projektu i uruchom:

```bash
npm install
```

To zainstaluje wszystkie potrzebne biblioteki (express, axios, cheerio, cors).

### Krok 3: Uruchom serwer

```bash
npm start
```

Powinieneś zobaczyć:
```
╔═══════════════════════════════════════╗
║   VINTED MONITOR SERVER URUCHOMIONY   ║
╚═══════════════════════════════════════╝

🚀 Serwer działa na: http://localhost:3000
📱 Aplikacja: http://localhost:3000/vinted-monitor.html
```

### Krok 4: Otwórz aplikację

Przejdź do: **http://localhost:3000/vinted-monitor.html**

---

## 🤖 Konfiguracja Bota Telegram

### Tworzenie Bota

1. **Otwórz Telegram** i znajdź bota **@BotFather**
   
2. **Wyślij komendę:** `/newbot`

3. **Podaj nazwę bota**, np: `Mój Monitor Vinted`

4. **Podaj username bota**, np: `MojMonitorVintedBot`
   - Musi kończyć się na "bot"
   - Musi być unikalny

5. **BotFather wyśle Ci token API** w formacie:
   ```
   123456789:ABCdefGHIjklMNOpqrsTUVwxyz12345678
   ```
   
6. **Skopiuj ten token** - będzie potrzebny w aplikacji!

### Uzyskanie Chat ID

1. **Wyślij dowolną wiadomość** do swojego nowo utworzonego bota

2. W aplikacji:
   - Wklej **Token Bota** w pole "Token Bota Telegram"
   - Kliknij przycisk **"Pobierz Chat ID"**
   - Chat ID pojawi się automatycznie w polu poniżej

3. **Kliknij "Zapisz Konfigurację"**

4. **Przetestuj** przyciskiem "Test Powiadomienia"
   - Powinieneś otrzymać wiadomość testową na Telegramie

---

## 📦 Dodawanie Przedmiotów do Monitorowania

### Monitorowanie konkretnego przedmiotu

1. Wybierz **"Konkretny przedmiot (URL)"**
2. Wklej link do przedmiotu z Vinted, np:
   ```
   https://www.vinted.pl/items/3456789-jakaś-nazwa
   ```
3. Kliknij **"Dodaj do Monitorowania"**

### Monitorowanie wszystkich przedmiotów użytkownika

1. Wybierz **"Wszystkie przedmioty użytkownika"**
2. Wklej link do profilu użytkownika, np:
   ```
   https://www.vinted.pl/member/12345-nazwa-uzytkownika
   ```
3. Kliknij **"Dodaj do Monitorowania"**

---

## ▶️ Uruchomienie Monitorowania

1. **Upewnij się**, że:
   - ✅ Telegram jest skonfigurowany
   - ✅ Dodano przynajmniej jeden przedmiot do monitorowania

2. Kliknij **"Uruchom Monitoring"**

3. **Monitor będzie sprawdzał przedmioty co 30 minut**

4. Gdy przedmiot zostanie sprzedany, **otrzymasz powiadomienie na Telegramie**:
   ```
   🎉 SPRZEDANE!
   
   Przedmiot został sprzedany!
   https://www.vinted.pl/items/...
   
   Data: 22.03.2026, 14:30:15
   ```

---

## ⚙️ Funkcje Aplikacji

### Status Monitor
- 🟢 **Zielony punkt** = Monitor aktywny
- 🟡 **Żółty punkt** = Monitor zatrzymany
- **Kolejne sprawdzenie** = Czas następnego sprawdzenia
- **Monitorowanych** = Liczba dodanych przedmiotów

### Historia Powiadomień
- Wyświetla wszystkie powiadomienia w aplikacji
- Zachowuje ostatnie 20 wpisów

### Zarządzanie
- **Usuń** - usuwa przedmiot z monitorowania
- **Zatrzymaj Monitoring** - zatrzymuje sprawdzanie
- **Test Powiadomienia** - testuje połączenie z Telegramem

---

## 💡 Wskazówki

### Jak długo zostawić włączoną aplikację?
- Aplikacja musi działać w przeglądarce przez cały czas monitorowania
- Komputer może być w trybie uśpienia (ale przeglądarka musi działać)
- Dla ciągłego monitorowania rozważ uruchomienie na serwerze VPS

### Co jeśli nie otrzymuję powiadomień?
1. Sprawdź czy token i Chat ID są poprawne
2. Użyj przycisku "Test Powiadomienia"
3. Upewnij się, że wysłałeś wiadomość do bota przed pobraniem Chat ID

### Zmiana częstotliwości sprawdzania
Domyślnie: **co 30 minut**

Aby zmienić, edytuj w pliku `vinted-monitor.html` linię:
```javascript
checkInterval: 30 * 60 * 1000 // 30 minut
```

Przykłady:
- Co 10 minut: `10 * 60 * 1000`
- Co godzinę: `60 * 60 * 1000`
- Co 5 minut: `5 * 60 * 1000`

⚠️ **UWAGA:** Zbyt częste sprawdzanie może spowodować zablokowanie IP przez Vinted!

---

## 🔒 Bezpieczeństwo

- **Nigdy nie udostępniaj** swojego tokena bota
- **Token daje pełen dostęp** do wysyłania wiadomości przez bota
- Dane są przechowywane **lokalnie w przeglądarce** (localStorage)
- Aplikacja **nie wysyła danych** na zewnętrzne serwery oprócz Vinted i Telegram API

---

## ❓ Rozwiązywanie Problemów

### Serwer nie startuje
```bash
# Sprawdź czy Node.js jest zainstalowany
node --version

# Zainstaluj zależności ponownie
npm install
```

### Błąd CORS / Nie można sprawdzić przedmiotu
- To normalne ograniczenie przeglądarek
- Serwer backend rozwiązuje ten problem
- Upewnij się, że serwer działa (`npm start`)

### Aplikacja nie działa po zamknięciu przeglądarki
- Aplikacja musi być **otwarta w przeglądarce** przez cały czas
- Komputer może być w trybie uśpienia
- Nie zamykaj karty przeglądarki z aplikacją

---

## 🚀 Wdrożenie na Serwer VPS (Opcjonalne)

Dla ciągłego działania 24/7:

1. Wynajmij VPS (np. DigitalOcean, Linode, Hetzner)
2. Zainstaluj Node.js na serwerze
3. Przenieś pliki projektu
4. Uruchom z PM2:
   ```bash
   npm install -g pm2
   pm2 start server.js
   pm2 save
   pm2 startup
   ```

---

## 📝 Licencja

MIT License - Możesz swobodnie modyfikować i używać

---

## 🆘 Wsparcie

Jeśli masz problemy:
1. Sprawdź czy serwer działa
2. Sprawdź konsolę przeglądarki (F12) pod kątem błędów
3. Upewnij się, że token Telegram jest poprawny
4. Zrestartuj serwer: Ctrl+C, potem `npm start`

**Powodzenia z monitorowaniem sprzedaży na Vinted! 🎉**
