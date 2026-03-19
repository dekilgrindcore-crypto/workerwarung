# Cloudflare Worker — Panduan Deploy

## Struktur Folder

```
project/
├── worker.js          ← file utama (semua logic + HTML + CSS + JS ada di sini)
├── wrangler.toml      ← konfigurasi Cloudflare
└── public/            ← file statis yang tidak bisa di-inline
    ├── favicon.ico
    ├── favicon-32x32.png
    ├── favicon-16x16.png
    ├── apple-touch-icon.png
    ├── site.webmanifest
    └── og-image.jpg
```

---

## wrangler.toml

```toml
name = "nama-worker-kamu"
main = "worker.js"
compatibility_date = "2025-01-01"

[assets]
directory = "./public"

[triggers]
crons = ["*/30 * * * *"]
```

---

## Environment Variables

Set di **Cloudflare Dashboard → Workers → nama worker → Settings → Variables and Secrets**.

Jangan tulis secret di wrangler.toml karena bisa ke-commit ke Git.

Contoh env yang biasa dipakai:

| Variable | Keterangan |
|---|---|
| `WARUNG_DOMAIN` | Domain utama, contoh: `example.com` |
| `DAPUR_API_KEY` | API key ke Dapur |
| `WARUNG_TYPE` | Tipe warung |

---

## Cara Deploy

### 1. Install Wrangler (sekali aja)
```bash
npm install -g wrangler
```

### 2. Login ke Cloudflare
```bash
wrangler login
```

### 3. Deploy
```bash
wrangler deploy
```

---

## Catatan Penting

- **CSS & JS** — sudah inline di dalam `worker.js`, tidak perlu taruh di `public/`
- **Favicon & OG image** — taruh di folder `public/`, Cloudflare otomatis serve dari sana
- **Path tidak berubah** — di kode tetap `/favicon.ico`, `/og-image.jpg` dll, tidak perlu diedit
- **KV & D1** — tidak dipakai, fitur yang butuh KV/D1 otomatis di-skip, tidak akan crash
