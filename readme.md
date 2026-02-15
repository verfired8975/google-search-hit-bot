# Google Search Click Bot

Google'da arama yapip belirtilen domain'i bulup tiklayan, sonra site icinde gezen bir bot. Puppeteer-real-browser + Node.js ile yazildi. Coklu thread destegi var.

## Ne yapar?

- `keywords.txt`'deki kelimelerle Google'da arama yapar
- Sonuclarda `config.json`'da belirttigin domain'i arar
- Bulunca tiklar, site icinde scroll yapar, link tiklar
- Her thread farkli cookie ve proxy kullanabilir
- Thread'leri istersen saatlere yayabilirsin

## Kurulum

```bash
git clone https://github.com/verfired8975/google-search-hit-bot.git
cd google-search-hit-bot
npm install
```

## Config

`config.json`'u kendine gore duzenle:

```json
{
  "domains": ["r10.net"],
  "maxPages": 5,
  "keywordsFile": "keywords.txt",
  "cookiesFolder": "cookies",
  "proxiesFile": "proxies.txt",
  "headless": false,
  "threads": 10,
  "browseTime": 60000,
  "maxClicks": 3,
  "spreadThreads": true,
  "timeFrameHours": 6,
  "executablePath": "auto"
}
```

`executablePath` icin `"auto"` yazarsan Chrome'u kendisi bulur (Windows/Mac/Linux farketmez). Istersen manuel de yazabilirsin.

| Parametre | Ne ise yarar |
|---|---|
| `domains` | Tiklanacak domain'ler |
| `maxPages` | Google'da kac sayfa taransin |
| `threads` | Kac bot ayni anda calissin |
| `browseTime` | Siteye girdikten sonra kac ms gezinsin |
| `maxClicks` | Site icinde kac link tiklassin |
| `spreadThreads` | `true` yaparsan thread'leri zamana yayar |
| `timeFrameHours` | Kac saate yayilsin |
| `headless` | `true` = gorunmez, `false` = tarayici acilir |

## Kullanim

`keywords.txt` icine kelimelerini yaz (her satira bir tane):

```
ornek kelime
ikinci kelime
```

`cookies/` klasorune cookie dosyalarini at (`.json` veya `.txt`). Her thread random birini secer, ayni cookie iki kez kullanilmaz.

Proxy kullanacaksan `proxies.txt`'e ekle:

```
host:port:user:pass
host:port
```

Sonra calistir:

```bash
node app.js
```

## Dosya yapisi

```
├── app.js                 # thread yoneticisi
├── runbrowser.js          # tek botun calismasi
├── config.json
├── keywords.txt
├── proxies.txt
├── cookies/
└── src/
    ├── browser.js         # tarayici baslat, captcha/cookie ekrani
    ├── search.js          # google arama, domain bulma, site gezinme
    ├── humanize.js        # scroll, mouse, bekleme sureleri
    ├── cookie-manager.js  # cookie yukle/parse et
    ├── proxy-manager.js   # proxy parse/rotasyon
    ├── ua-generator.js    # rastgele user-agent uret
    ├── config-loader.js   # config oku/dogrula
    └── logger.js          # konsol ciktisi
```

## Ornek cikti

```
[SYSTEM] Domains: r10.net
[SYSTEM] Keywords: 3 adet
[SYSTEM] Threads: 1
[SYSTEM] Tum thread'ler aninda baslatiliyor...

========== THREAD-1 ==========

[THREAD-1] Browser basladi
[THREAD-1] Cookie yuklendi: cookie1.txt (5 adet)
[SEARCH] Araniyor: "ornek kelime"
[SEARCH] Sayfa 1 taraniyor...
[THREAD-1] Domain bulundu: https://www.r10.net/konu
[THREAD-1] Tiklandi: https://www.r10.net/konu
[THREAD-1] Gezinme tamamlandi (2 tiklama)
[THREAD-1] Tamamlandi
=== Progress: 1 success / 0 fail / 1 total ===
```

## Yol haritasi

| Star | Gelecek ozellik |
|---|---|
| 25 | Bing ve Yandex destegi |
| 50 | Dashboard - web arayuzu uzerinden bot yonetimi |
| 100 | CAPTCHA cozucu entegrasyonu (2captcha, anticaptcha) |
| 200 | Telegram bot ile uzaktan kontrol ve bildirim |
| 500 | Zamanlanmis gorevler (cron), otomatik tekrar calistirma |

