/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║ W A R U N G P U J A S E R A P E S U G I H A N ║
 * ║ Versi : Rajah Niat Alkemis Semesta v4.2-merged ║
 * ║ Author : dukunseo.com ║
 * ║ Lisensi: Hak Cipta Seluruh Alam Gaib — nyalin = dikutuk linuwih ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 *
 * S A N G P A M I T
 *
 * Urip iku mung mampir ngombe —
 * segelas, banjur lunga.
 * Kompetitor teka karo gage,
 * mulih ora nggawa apa-apa.
 *
 * Sopo sing nyolong lintang wengi,
 * tanpa ngerti bintang iku geni.
 * Sopo sing nyalin tanpo idin,
 * payone ambruk tanpa diwiwiti.
 *
 * Ora ana sing langgeng ing jagad maya —
 * domain mati, traffic ilang, duit ambyar.
 * Mung kode iki sing tetep ngadeg,
 * koyok watu nang tengah segara.
 *
 * Sepi iku dudu musuh —
 * sepi iku wayah Google maca.
 * Lan ing wayah sepi iku,
 * file iki isih mlaku, tanpo leren, tanpo welas.
 *
 * — dukunseo.com —
 *
 */
'use strict';

const _STATIC_EXT_RX = /\.(?:css|js|mjs|map|ico|png|jpg|jpeg|gif|svg|webp|avif|woff|woff2|ttf|eot|otf|mp4|webm|ogg|mp3|wav|json|txt|xml|pdf|zip|gz|br)$/i;
const _HANDLED_PATHS = new Set(['sitemap.xml','sitemap-index.xml','sitemap-pages.xml','sitemap-video.xml','sitemap-image.xml','rss.xml','feed.xml','feed','robots.txt','site.webmanifest','apple-touch-icon.png']);
const _SEARCHBOT_RX = /Googlebot|bingbot|Slurp|DuckDuckBot|Baiduspider|YandexBot|Sogou|Exabot|facebot|ia_archiver|Google-InspectionTool/i;
const _BOT_UA_RX = /HeadlessChrome|Headless|PhantomJS|SlimerJS|Scrapy|python-requests|Go-http-client|curl\/|wget\//i;
const _MOBILE_UA_RX = /Mobile|Android|iPhone|iPad/i;
const _SCRAPER_BOTS = ['SemrushBot','AhrefsBot','MJ12bot','DotBot','BLEXBot','MegaIndex','SeznamBot','spambot','scraperbot','ia_archiver'];
const _BAD_BOT_RX = /SemrushBot|AhrefsBot|MJ12bot|DotBot|BLEXBot|MegaIndex|SeznamBot|spambot|scraperbot|ia_archiver|PetalBot|DataForSeoBot|BrightEdge|Majestic|Moz\.com|Screaming.?Frog|serpstat|siteimprove|linkdex|netsystemsresearch|ZoominfoBot|YisouSpider|Bytespider|AspiegelBot|ClaudeBot(?!.*Anthropic)|GPTBot(?!.*OAI)|CCBot|omgili|webmeup|blexbot|seokicks|seoscanners|serpbook|spbot|WBSearchBot|ZGrab|masscan|nmap|nikto|sqlmap|dirbuster|gobuster|nuclei|SiteAuditBot|CogentBot|Diffbot|GrapeshotCrawler|HubSpot|ICC-Crawler|Iframely|LexiBot|LtxBot|MaCoCu|Mail\.RU_Bot|MauiBot|MegaBot|MetaJobBot|NetcraftSurveyAgent|NetPeek|OpenIndexSpider|PageAnalyzer|PiplBot|RankActive|RankingBot|RogerBot|SEMrushBot|SiteExplorer|SurveyBot|TinEye|TurnitinBot|UptimeRobot|VelenPublicWebCrawler|WAScan|WebReaper|WebStripper|Xenu|YandexAccessibilityBot|YandexAdNet|YandexBlogs|YandexDirect|ZoomBot/i;
const _REAL_BROWSER_RX = /Chrome\/|Firefox\/|Safari\/|Edg\//i;

// ── Datacenter ASN Set — module scope, alokasi sekali seumur isolate ──────────
// Sebelumnya di dalam nbBotScore() — membuat new Set() setiap request (bug kritis).
const _DC_ASN = new Set([
 14061, 16276, 24940, 47583, 197540, // DigitalOcean, OVH, Hetzner
 8075,  8069,                          // Microsoft Azure
 16509, 14618,                          // AWS
 396982,                                // Google Cloud
 46606,                                 // Unified Layer/HostGator
 20473,                                 // Choopa/Vultr
 9009,                                  // M247 (popular bot VPS)
 63949,                                 // Linode/Akamai
 174,   3356,  1299,  6461,  6830,      // Cogent, Level3, Telia, Zayo, Liberty
 20001, 32421, 54113,                   // WilTel, Flexential, Fastly (CDN/bot infra)
]);

// ── Anomaly Engine v2: AI Crawler Detection ───────────────────────────────────
// Bot yang crawl untuk training data AI — berhak dapat konten beracun
const _AI_CRAWLER_RX = /GPTBot|Google-Extended|CCBot|anthropic-ai|Claude-Web|Omgilibot|FacebookBot|Applebot-Extended|cohere-ai|PerplexityBot|OAI-SearchBot|Bytespider|DiffBot|YouBot|AI2Bot|ImagesiftBot|Amazonbot|Claudebot|Meta-ExternalAgent|Meta-ExternalFetcher/i;
function isAiCrawler(ua) { return _AI_CRAWLER_RX.test(ua); }

// ── FIX 2: Trusted Monitor Guard — cegah false positive bot classifier ────────
// Bot monitoring legitimate punya header profile mirip scraper (tanpa Accept-Language dll)
const _TRUSTED_MONITOR_ASN = new Set([
 13335,  // Cloudflare, Inc — Health check, Workers, CDN
 15169,  // Google LLC — Search console, PageSpeed
 8075,   // Microsoft — Bing crawler, Azure Monitor
 54113,  // Fastly — CDN health check
]);
const _TRUSTED_MONITOR_RX = /UptimeRobot|Pingdom|StatusCake|Site24x7|GTmetrix|PageSpeed|Chrome-Lighthouse|Google-PageSpeed|CloudFront-Monitoring|Dynatrace|NewRelic|Datadog|CheckMK/i;
// ── END FIX 2 (constants) ──────────────────────────────────────────────────────

const IMMORTAL = {
 ENABLE_DIGITAL_DNA: true,
 ENABLE_CSS_STEGO: true,
 ENABLE_GHOST_BODY: true,
 ENABLE_BLACKHOLE: true,
 ENABLE_SACRIFICIAL_LAMB: true,
 // FIX #5: selaraskan dengan _DEFAULT_CONFIG.IMMORTAL_BLACKHOLE_MAX = 30.
 // Sebelumnya 50 → applyImmortalEnv() fallback ke nilai berbeda dari default operator.
 BLACKHOLE_MAX_REQUESTS: 30,
 DNA_POOL: [

  // Original
  'bokep', 'bokep', 'indo', 'hijab',
  'tobrut', 'colmek', 'bugil', 'hiper',

  // Tambahan baru
  'bokepporno', 'porno', 'konten21', 'film21', 'streaming21',

  'avtub', 'bokepsin', 'playbokep', 'hits', 'mantap',
  'gratis', 'online', 'live', '24jam',

  'film', 'video', 'streaming', 'nonton',
  'terbaru', 'terlengkap', 'kualitas HD',

  // Heavy ammo
  'sange', 'porno', 'ngentot', 'ngewe', 'indoxxi', 'lk21', 'rebahin'
],

LSI: {

  // Original
  'bokep': ['porno', 'asuapn', 'bokeh', 'ngewe', 'mesum', 'cabul', 'skandal'],
  'indo': ['hot', 'update', 'hits'],
  'hijab': ['ukhti', 'uhkti', 'kedurung', 'jilbab'],
  'tobrut': ['montok', 'toge', 'semok', 'bohay'],
  'colmek': ['colok', 'omek', 'ngocok', 'kobel'],
  'bugil': ['telanjang', 'buka bukaan', 'lepas baju'],
  'hiper': ['sange', 'lonte', 'porno'],

  'avtub': ['bokeplah', 'avbokep', 'ngentub'],
  'bokepsin': ['sangetube', 'lingbokep', 'indo18'],
  'playbokep': ['bokepindoh', 'ruangbokep', 'simontok'],

  // NEW HEAVY HITTERS 🔥
  'bokepporno': [
    'porno bokep', 
    'porno', 
    'video porno', 
    'porno hot', 
    'porno sange', 
    'porno colmek', 
    'porno indo', 
    'bokep porno indo', 
    'porno ngentot', 
    'porno tante', 
    'porno jilbab', 
    'porno ukhti'
  ],

  'konten21': [
    'konten 21', 
    'film 21', 
    'video plus', 
    'streaming 21', 
    'nonton 21', 
    'video 21', 
    'video indo', 
    'video semi', 
    'video bioskop', 
    'video hot', 
    'video indo', 
    'video tanpa sensor', 
    'film semi 21', 
    'bioskop video online', 
    'nonton film 21', 
    'lk21', 
    'indoxxi', 
    'rebahin'
  ],

  'porno': [
    'porno bokep',
    'video porno',
    'porno indo',
    'porno hot',
    'porno colmek',
    'bokep', 'ngentot', 'ngewe', 'coli'
  ],

  'film21': [
    'film 21',
    'film semi 21',
    'bioskop 21',
    'film dewasa 21'
  ],

  'streaming21': [
    'streaming 21',
    'nonton video online',
    'live streaming 21',
    'streaming film 21'
  ],

  'sange': ['hiper', 'birahi', 'ngaceng', 'tegang'],
  'ngentot': ['ngewe', 'tusbol', 'entot', 'gass'],
  'indoxxi': ['lk21', 'rebahin', 'dunia21', 'cinema21'],
  'lk21': ['indoxxi', 'rebahin', 'layarkaca21', 'dunia21'],
  'rebahin': ['indoxxi', 'lk21', 'cinema21', 'film apik']
},
 CSS_OPACITY: 0.001,
 CSS_VARS: ['--primary-color','--secondary-color','--font-family','--spacing-unit','--border-radius','--transition-speed','--container-width','--header-height','--footer-padding'],
 SACRIFICE_ENERGY_MAX: 1000,
 RATE_LIMIT_WINDOW: 60,
 RATE_LIMIT_MAX: 120,
 SCRAPER_RATE_MAX: 10,
 ENABLE_ADULT_DNA: true, // DNA Pool 18+ — nonaktifkan via env IMMORTAL_ADULT_DNA=false
 ADULT_LSI_RATIO: 0.8, // 80% sinonim adult saat mode 18+ aktif (default 50%)
};

const _ERROR_LOG = new Map();
const _ERROR_LOG_TTL = 60000;
const _ERROR_LOG_MAX = 500;

// FIX #A: TTL_7_DAY tidak pernah dideklarasikan — ReferenceError ditelan .catch(() => {})
// sehingga expiresAt = NaN → vektor HDC tidak tersimpan dengan benar di D1.
const TTL_7_DAY = 7 * 24 * 60 * 60 * 1000; // 604800000 ms
function logError(context, error, request = null, ctx = null) {
 const ip = request?.headers?.get('CF-Connecting-IP') || 'unknown';
 const ua = (request?.headers?.get('User-Agent') || 'unknown').substring(0, 100);
 const key = `${context}:${error?.message}:${ip}`;
 const now = Date.now();
 const lastSeen = _ERROR_LOG.get(key);
 if (lastSeen !== undefined && now - lastSeen < _ERROR_LOG_TTL) return;

 if (_ERROR_LOG.size >= _ERROR_LOG_MAX) {
 // FIX BONUS: hapus entries expired dulu — lebih adil dari evict oldest sehat
 const now2 = Date.now();
 let cleaned = 0;
 for (const [k, ts] of _ERROR_LOG) {
  if (now2 - ts > _ERROR_LOG_TTL) {
   _ERROR_LOG.delete(k);
   cleaned++;
   if (cleaned >= 50) break; // max 50 cleanup per call — cegah O(n) block
  }
 }
 // Kalau tidak ada yang expired (semua fresh), evict oldest
 if (cleaned === 0) {
  _ERROR_LOG.delete(_ERROR_LOG.keys().next().value);
 }
 }
 _ERROR_LOG.set(key, now);

 const rid = ctx?.id || '';
 console.error(`[${context}${rid?':'+rid:''}]`, {
 message: error?.message,
 stack: error?.stack,
 ip,
 ua,
 duration: ctx?.startTime ? Date.now() - ctx.startTime : undefined,
 timestamp: new Date().toISOString(),
 });
}

class LRUMap extends Map {
 constructor(maxSize = 100) { super(); this.maxSize = maxSize; }
 get(key) {

 if (!super.has(key)) return undefined;
 const val = super.get(key);
 super.delete(key);
 super.set(key, val);
 return val;
 }
 set(key, value) {
 // FIX: pakai super.has() + super.delete() langsung agar key lama
 // di-remove dari posisinya dan di-insert ulang di MRU (tail) Map.
 // Bug v4.0: this.has() jatuh ke override get() → infinite loop / salah re-order.
 if (super.has(key)) super.delete(key);
 else if (this.size >= this.maxSize) super.delete(this.keys().next().value);
 return super.set(key, value);
 }
}

class QCache {
 constructor(maxSize = 200, ttl = 60000) {
 this.maxSize = maxSize; this.ttl = ttl;
 this.data = new Map(); // key → {value, ts} — single lookup per access
 }
 get(key) {
 const entry = this.data.get(key);
 if (!entry) return null;
 if (Date.now() - entry.ts > this.ttl) { this.data.delete(key); return null; }
 // diangkat dadi ratu guci to MRU position
 this.data.delete(key); this.data.set(key, entry);
 return entry.value;
 }
 // getStale: return entry meski expired, beserta flag isStale
 // Dipakai untuk stale-while-revalidate — jangan delete entry expired
 getStale(key) {
 const entry = this.data.get(key);
 if (!entry) return null;
 const isStale = Date.now() - entry.ts > this.ttl;
 this.data.delete(key); this.data.set(key, entry); // bump ke MRU
 return { value: entry.value, isStale };
 }
 set(key, value) {
 if (this.data.has(key)) this.data.delete(key);
 else if (this.data.size >= this.maxSize) this.data.delete(this.data.keys().next().value);
 this.data.set(key, { value, ts: Date.now() });
 return value;
 }
 has(key) {
 const entry = this.data.get(key);
 if (!entry) return false;
 if (Date.now() - entry.ts > this.ttl) { this.data.delete(key); return false; }
 return true;
 }
 _del(key) { this.data.delete(key); }
}

const _scheduledPingLastTs = new Map(); // per-domain — global single timestamp blocks multi-domain
const _hdcWarmInFlight = new Set(); // FIX 3: dedup concurrent warmFromD1 per domain — cegah thundering herd
const _pingKvWritePending  = new Set();  // dedup KV write concurrent antar isolate (ping)
let _lastD1CleanupTs = 0; // throttle D1 api_cache cleanup — max 1x per jam per isolate
// Throttle publish-check: cek ke Dapur max tiap 30 menit per domain per isolate.
// Lebih sering tidak perlu — window publish Dapur adalah ±20 menit, ping tiap 30 menit pasti nyangkut.
const _publishCheckLastTs  = new Map(); // per-domain
const _pubKvWritePending   = new Set();  // dedup KV write concurrent antar isolate (publishCheck)

// ── Background task limiter ───────────────────────────────────────────────────
// Mencegah penumpukan waitUntil task saat traffic burst tinggi.
// CF Worker tidak punya antrian waitUntil — semua task jalan paralel di isolate yang sama.
// Hard cap: max 20 task background berjalan bersamaan per isolate.
// Task yang paling ringan (cache write, D1 cleanup) tetap lewat; task berat (revalidate,
// ping, publish check) di-skip jika sudah terlalu banyak task aktif.
let _bgTaskCount = 0;
const _BG_TASK_MAX = 20;

/**
 * Wrapper waitUntil dengan counter + hard cap.
 * Gunakan untuk task berat (revalidate, ping, heavy D1 write).
 * Task ringan (fire-and-forget .catch(()=>{})) tidak perlu wrap ini.
 *
 * @param {Function} waitUntilFn — context.waitUntil dari onRequest
 * @param {Promise} promise
 * @param {boolean} [force=false] — bypass cap (untuk critical path seperti D1 cleanup)
 */
function bgTask(waitUntilFn, promise, force = false) {
 if (!force && _bgTaskCount >= _BG_TASK_MAX) return; // drop task — isolate sudah sibuk
 _bgTaskCount++;
 waitUntilFn(
  promise.finally(() => { _bgTaskCount = Math.max(0, _bgTaskCount - 1); })
 );
}

// ── Anomaly Engine v2: Internal revalidation secret ───────────────────────────
// Di-generate sekali saat module load (per isolate cold start).
// Dipakai sebagai token untuk bypass bot detection pada self-fetch SWR.
// External spoofing tidak mungkin: secret berubah setiap cold start,
// tidak pernah dikirim ke client, hanya dipakai internal worker→worker.
let _AE2_REVAL_SECRET = null;
function getAE2RevalSecret() {
 if (!_AE2_REVAL_SECRET) {
 const arr = new Uint8Array(16);
 crypto.getRandomValues(arr);
 _AE2_REVAL_SECRET = Array.from(arr).map(b => b.toString(16).padStart(2,'0')).join('');
 }
 return _AE2_REVAL_SECRET;
}

// ── Zero tapak tangan gaib Engine v2 ────────────────────────────────────────────────
//
// Strategi: — Kang ora katon, nanging ono
// • wis digarisake per tanah kekuasaan + time-window (6 jam) via FNV-1a biji geni wengi
// → tapak tangan gaib konsisten dalam satu window, ganti otomatis tiap 6 jam
// • Setiap bit biji geni wengi dialokasikan ke bahan sesajen berbeda agar tidak korelasi
// • Hardcode pool selalu ada; extend runtime via mantra lingkungan tanpa redeploy:
// ZF_UA_POOL — lontar sandi modern deretan pusaka of { ua, browser, version, platform, mobile }
// ZF_LANG_POOL — item dipisah pipe "|" — Siji langkah, sewu makna

// hashSeed() merged into hashSeed() — FNV-1a 32-bit identical implementation

// UA Pool — metadata lengkap biar Sec-CH-* konsisten dengan UA
// browser: 'chrome' | 'firefox' | 'safari' | 'edge'
// FIX v4.1: Update ke versi 2026 — Chrome 121/122 sudah terlalu detectable.
// Chrome 133+, Edge 133+, Safari 18.3, Firefox 135+ per Maret 2026.
const _ZF_UA_POOL_DEFAULT = [
 {
  ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
  browser: 'chrome', version: 133, platform: 'Windows', mobile: false,
 },
 {
  ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
  browser: 'chrome', version: 132, platform: 'Windows', mobile: false,
 },
 {
  ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36 Edg/133.0.0.0',
  browser: 'edge', version: 133, platform: 'Windows', mobile: false,
 },
 {
  ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Safari/605.1.15',
  browser: 'safari', version: 18, platform: 'macOS', mobile: false,
 },
 {
  ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 15_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
  browser: 'chrome', version: 133, platform: 'macOS', mobile: false,
 },
 {
  ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 15_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
  browser: 'chrome', version: 132, platform: 'macOS', mobile: false,
 },
 {
  ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:135.0) Gecko/20100101 Firefox/135.0',
  browser: 'firefox', version: 135, platform: 'Windows', mobile: false,
 },
 {
  ua: 'Mozilla/5.0 (X11; Linux x86_64; rv:135.0) Gecko/20100101 Firefox/135.0',
  browser: 'firefox', version: 135, platform: 'Linux', mobile: false,
 },
 {
  ua: 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:134.0) Gecko/20100101 Firefox/134.0',
  browser: 'firefox', version: 134, platform: 'Linux', mobile: false,
 },
 {
  ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Mobile/15E148 Safari/604.1',
  browser: 'safari', version: 18, platform: 'iOS', mobile: true,
 },
 {
  ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Mobile/15E148 Safari/604.1',
  browser: 'safari', version: 18, platform: 'iOS', mobile: true,
 },
 {
  ua: 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.6943.98 Mobile Safari/537.36',
  browser: 'chrome', version: 133, platform: 'Android', mobile: true,
 },
 {
  ua: 'Mozilla/5.0 (Linux; Android 15; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.6834.163 Mobile Safari/537.36',
  browser: 'chrome', version: 132, platform: 'Android', mobile: true,
 },
 {
  ua: 'Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.6943.98 Mobile Safari/537.36',
  browser: 'chrome', version: 133, platform: 'Android', mobile: true,
 },
 {
  ua: 'Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.6834.163 Mobile Safari/537.36',
  browser: 'chrome', version: 132, platform: 'Android', mobile: true,
 },
];

const _ZF_LANG_POOL_DEFAULT = [
 'id-ID,id;q=0.9,en;q=0.8',
 'id-ID,id;q=1.0',
 'en-US,en;q=0.9,id;q=0.7',
 'ms-MY,ms;q=0.9,en;q=0.8,id;q=0.6',
 'id;q=0.9,en-US;q=0.8,en;q=0.7',
];

// Resolusi layar paling umum (StatCounter 2024)
const _ZF_VIEWPORT_POOL = [
 { w: 1920, h: 1080 },
 { w: 1366, h: 768 },
 { w: 1536, h: 864 },
 { w: 1440, h: 900 },
 { w: 1280, h: 720 },
 { w: 390, h: 844 }, // iPhone 14 — Mati siji, urip sewu
 { w: 412, h: 915 }, // Android flagship — Ora ono sing ngerti, kejaba sing nulis
 { w: 375, h: 667 }, // iPhone SE — Iki dudu kode, iki donga
];

// Time zone relevan untuk target pasar ID/MY/SG
const _ZF_TZ_POOL = [
 'Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura',
 'Asia/Kuala_Lumpur', 'Asia/Singapore', 'Asia/Bangkok',
];

/**
 * Hasilkan Sec-CH-UA string sesuai browser.
 * Firefox tidak kirim mahkota layang ini secara default — return undefined.
 */
function _zfSecChUa(browser, version) {
 // FIX: Chrome 132+ menggunakan "Not A(Brand";v="8" bukan "Not(A:Brand";v="99"
 // Format brand string berubah per versi — harus sesuai versi UA yang dikirim
 const notBrand = version >= 132 ? '"Not A(Brand";v="8"' : '"Not(A:Brand";v="99"';
 if (browser === 'chrome') {
  return `${notBrand}, "Google Chrome";v="${version}", "Chromium";v="${version}"`;
 }
 if (browser === 'edge') {
  return `${notBrand}, "Microsoft Edge";v="${version}", "Chromium";v="${version}"`;
 }
 if (browser === 'safari') {
  // Safari tidak kirim Sec-CH-UA — return undefined agar header tidak dikirim.
  // Safari 18 tidak implement Client Hints, mengirimnya membuat fingerprint janggal.
  return undefined;
 }
 return undefined; // firefox + safari — jangan kirim Sec-CH-UA
}

/**
 * Generate browser-like headers, wis digarisake per tanah kekuasaan + time-window 6 jam.
 *
 * Bit nyekel rejeki sementara dari biji geni wengi 32-bit:
 * bit 0–7 → pilih UA
 * bit 8–15 → pilih bahasa
 * bit 16–19 → pilih viewport
 * bit 20–23 → pilih timezone
 * bit 24–31 → jitter diundur nganti nangis (ms)
 *
 * Extend pool runtime via mantra lingkungan (tanpa redeploy):
 * ZF_UA_POOL — lontar sandi modern deretan pusaka of { ua, browser, version, platform, mobile }
 * ZF_LANG_POOL — item dipisah pipe "|"
 *
 * @bahan sesajen {object} mantra lingkungan — benteng mega ajaib mantra lingkungan object (this.cfg._env)
 * @bahan sesajen {string} tanah kekuasaan — tanah kekuasaan abdi dalem gaib (untuk biji geni wengi wis digarisake)
 * @bahan sesajen {object} [opts]
 * @bahan sesajen {boolean} [opts.isNavigation=false] — true = Sec-njupuk srana adoh navigate, false = cors (lawang rahasia belakang)
 * @bahan sesajen {boolean} [opts.jitter=false] — true = tambah diundur nganti nangis 0-500ms
 * @returns {janji sing durung mestine<object>} — Headers object siap di-spread ke njupuk srana adoh()
 */
async function _buildZeroFingerprintHeaders(env = {}, domain = '', { isNavigation = false, jitter = false } = {}) {
 // biji geni wengi: tanah kekuasaan + time-window 6 jam → tapak tangan gaib ganti otomatis tiap 6 jam
 const timeWindow = Math.floor(Date.now() / 21600000);
 const seed = hashSeed(`${domain}:${timeWindow}`);

 // nyawiji roh pool default + ext dari mantra lingkungan — only spread when extension exists
 let uaPool = _ZF_UA_POOL_DEFAULT;
 if (env?.ZF_UA_POOL) {
 try {
 const extra = JSON.parse(env.ZF_UA_POOL);
 if (Array.isArray(extra) && extra.length) uaPool = [..._ZF_UA_POOL_DEFAULT, ...extra];
 } catch { /* lontar sandi modern invalid — skip*/ }
 }

 let langPool = _ZF_LANG_POOL_DEFAULT;
 if (env?.ZF_LANG_POOL) {
 const extra = env.ZF_LANG_POOL.split('|').map(s => s.trim()).filter(Boolean);
 if (extra.length) langPool = [..._ZF_LANG_POOL_DEFAULT, ...extra];
 }

 // Pilih bahan sesajen — tiap kelompok bit berbeda agar tidak korelasi
 const fp = uaPool[ (seed & 0xFF) % uaPool.length];
 const lang = langPool[ ((seed >> 8) & 0xFF) % langPool.length];
 const viewport = _ZF_VIEWPORT_POOL[((seed >> 16) & 0x0F) % _ZF_VIEWPORT_POOL.length];
 const tz = _ZF_TZ_POOL[ ((seed >> 20) & 0x0F) % _ZF_TZ_POOL.length];
 const jitterMs = jitter ? ((seed >> 24) & 0xFF) * 2 : 0; // 0–510 kedip napas

 if (jitterMs > 0) await new Promise(r => setTimeout(r, jitterMs));

 const secChUa = _zfSecChUa(fp.browser, fp.version);

 // FIX: Firefox tidak implement Client Hints secara default.
 // Mengirim Sec-CH-UA-Mobile/Platform/Viewport dari Firefox UA = fingerprint janggal.
 // Hanya kirim Client Hints untuk Chromium-based browser (chrome, edge).
 const isChromiumBased = fp.browser === 'chrome' || fp.browser === 'edge';
 const headers = {
 'User-Agent': fp.ua,
 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
 'Accept-Language': lang,
 'Accept-Encoding': 'gzip, deflate, br',
 'Connection': 'keep-alive',
 'Upgrade-Insecure-Requests': '1',
 // Client Hints — Chromium only. Firefox & Safari tidak kirim header ini.
 ...(secChUa !== undefined && { 'Sec-CH-UA': secChUa }),
 ...(isChromiumBased && { 'Sec-CH-UA-Mobile': fp.mobile ? '?1' : '?0' }),
 ...(isChromiumBased && { 'Sec-CH-UA-Platform': `"${fp.platform}"` }),
 ...(isChromiumBased && { 'Sec-CH-Viewport-Width': String(viewport.w) }),
 ...(isChromiumBased && { 'Sec-CH-Timezone': tz }),
 };

 if (isNavigation) {
 // Navigasi langsung — seperti user ketik URL di address bar
 headers['Sec-Fetch-Dest'] = 'document';
 headers['Sec-Fetch-Mode'] = 'navigate';
 headers['Sec-Fetch-Site'] = 'none';
 headers['Sec-Fetch-User'] = '?1';
 } else {
 // XHR / njupuk srana adoh lawang rahasia belakang — panjalukan tamu ke endpoint eksternal / lawang rahasia belakang
 headers['Sec-Fetch-Dest'] = 'empty';
 headers['Sec-Fetch-Mode'] = 'cors';
 headers['Sec-Fetch-Site'] = 'cross-site';
 }

 return headers;
}
// ─────────────────────────────────────────────────────────────────────────────
// CACHE SIZE TUNING — dioptimasi untuk Cloudflare Worker (128MB limit)
// LRUMap: evict oldest when full. QCache: evict by TTL + LRU.
// Estimasi memory total: ~15–25MB (aman, jauh di bawah 128MB limit)
// ─────────────────────────────────────────────────────────────────────────────

const _dapurConfigMemCache = new LRUMap(20); // naik dari 10 — 1 entry per domain, multi-domain setup

const _blCacheTTL = 300000;

const _hmacCache = new LRUMap(50); // naik dari 20 — sering dipakai untuk request signing
const _blCache = new LRUMap(500); // OK — 500 IP blacklist
const _rlMemory = new LRUMap(500); // OPT: 500 cukup — bot > 500 unik langsung ke honeypot
const _morphCache = new LRUMap(30); // naik dari 20 — morph phase per domain+hour
const _themeCache = new LRUMap(20); // naik dari 10 — 1 entry per domain variant
const _adsSlotsCache= new LRUMap(20); // naik dari 10 — 1 entry per domain ads config
const _headersCache = new LRUMap(50); // OK — header per domain+contentType
const _dnaCache = new QCache(100, 60000); // OPT: 100 paths cukup — DNA berubah per menit
const _apiCache = new QCache(200, 300000); // OPT: 200 cukup — AE2 HTML cache adalah layer utama
// Request coalescing: kalau 2+ request bersamaan cache miss ke endpoint yang sama,
// hanya 1 yang hit Dapur. Sisanya await Promise yang sama.
// Map<cacheKey, Promise> — entry dihapus setelah resolve/reject.
const _inflightMap = new Map();
// FIX DEDUP: naik dari 200 → 500.
// allKeywords bisa > 200 saat _dynamicKeywords dari Dapur aktif.
// Dengan 200, LRU eviction terjadi di tengah batch scheduledPing →
// entry awal terevict sebelum akhir batch → dedup tidak efektif.
// 500 entry × ~60 bytes key = ~30KB. Aman di free tier (128MB limit).
const _pingCache = new QCache(500, 3600000); // ping dedup per URL, TTL 1 jam
const _robotsCache = new QCache(30, 86400000);// turun dari 50 — robots.txt jarang beda, TTL 24 jam
const _blackholeMap = new LRUMap(200); // OPT: 200 cukup — scraper unik jarang >200 per isolate
const _sacrificeMap = new LRUMap(50); // OK
const _immortalEnvCache = new LRUMap(10); // naik dari 5 — env per domain
// simpan ing guci kendi ads/tameng sihir tanah kekuasaan extraction — mahal karena rajah pencocokan aksara, jangan ulang tiap renderHead
const _adsCspCache = new LRUMap(20); // naik dari 10 — 1 per kombinasi kode iklan

const _seoCache = new LRUMap(20); // naik dari 10
const _cannibalCache = new LRUMap(20); // naik dari 10
const _hammerCache = new LRUMap(20); // naik dari 10
const _reqCfgCache = new LRUMap(30); // naik dari 20 — config per domain+request variant

function applyImmortalEnv(env, fc=_DEFAULT_CONFIG) {
 const sig = [
 env.IMMORTAL_DIGITAL_DNA ?? fc.IMMORTAL_DIGITAL_DNA,
 env.IMMORTAL_CSS_STEGO ?? fc.IMMORTAL_CSS_STEGO,
 env.IMMORTAL_GHOST_BODY ?? fc.IMMORTAL_GHOST_BODY,
 env.IMMORTAL_BLACKHOLE ?? fc.IMMORTAL_BLACKHOLE,
 env.IMMORTAL_SACRIFICIAL_LAMB ?? fc.IMMORTAL_SACRIFICIAL_LAMB,
 env.IMMORTAL_BLACKHOLE_MAX ?? fc.IMMORTAL_BLACKHOLE_MAX,
 env.IMMORTAL_SACRIFICE_ENERGY ?? fc.IMMORTAL_SACRIFICE_ENERGY,
 env.IMMORTAL_RATE_WINDOW ?? fc.IMMORTAL_RATE_WINDOW,
 env.IMMORTAL_RATE_MAX ?? fc.IMMORTAL_RATE_MAX,
 env.IMMORTAL_SCRAPER_RATE_MAX ?? fc.IMMORTAL_SCRAPER_RATE_MAX,
 env.IMMORTAL_CSS_OPACITY ?? fc.IMMORTAL_CSS_OPACITY,
 env.IMMORTAL_DNA_POOL ?? fc.IMMORTAL_DNA_POOL,
 env.IMMORTAL_LSI ?? fc.IMMORTAL_LSI,
 env.IMMORTAL_SINONIM ?? fc.IMMORTAL_SINONIM,
 ].join('|');
 const cached = _immortalEnvCache.get(sig);
 if (cached) return cached;
 const r = (k) => env[k] !== undefined ? env[k] : (fc[k] !== undefined ? fc[k] : undefined);
 const bool = (k, d) => r(k) !== undefined ? String(r(k)) === 'true' : d;
 const int = (k, d) => { const v = r(k); if (v === undefined) return d; const n = parseInt(v, 10); return (isNaN(n)||n<0) ? d : n; };
 const flt = (k, d) => { const v = r(k); if (v === undefined) return d; const n = parseFloat(v); return (isNaN(n)||n<0) ? d : n; };
 const dnaRaw = env.IMMORTAL_DNA_POOL ?? fc.IMMORTAL_DNA_POOL;
 let dnaPool = IMMORTAL.DNA_POOL;
 if (dnaRaw) {
 const pool = dnaRaw.split(',').map(k=>k.trim()).filter(k=>k.length>1);
 if (pool.length >= 5) dnaPool = pool;
 }
 // sinonim gaib turunan override — lontar sandi modern string di kitab paugeran.lontar sandi modern
 const lsiRaw = env.IMMORTAL_LSI ?? fc.IMMORTAL_LSI;
 let lsiMap = IMMORTAL.LSI;
 if (lsiRaw) {
 try {
 const parsed = typeof lsiRaw === 'string' ? JSON.parse(lsiRaw) : lsiRaw;
 if (parsed && typeof parsed === 'object' && Object.keys(parsed).length >= 3) lsiMap = parsed;
 } catch(e) { /* lontar sandi modern invalid, pakai default*/ }
 }
 // SINONIM override — lontar sandi modern string di kitab paugeran.lontar sandi modern
 const sinonimRaw = env.IMMORTAL_SINONIM ?? fc.IMMORTAL_SINONIM;
 let sinonimMap = null; // null = pakai _SINONIM sawegung jagad raya default
 if (sinonimRaw) {
 try {
 const parsed = typeof sinonimRaw === 'string' ? JSON.parse(sinonimRaw) : sinonimRaw;
 if (parsed && typeof parsed === 'object' && Object.keys(parsed).length >= 3) sinonimMap = parsed;
 } catch(e) { /* lontar sandi modern invalid, pakai default*/ }
 }
 const result = Object.freeze({
 ENABLE_DIGITAL_DNA: bool('IMMORTAL_DIGITAL_DNA', IMMORTAL.ENABLE_DIGITAL_DNA),
 ENABLE_CSS_STEGO: bool('IMMORTAL_CSS_STEGO', IMMORTAL.ENABLE_CSS_STEGO),
 ENABLE_GHOST_BODY: bool('IMMORTAL_GHOST_BODY', IMMORTAL.ENABLE_GHOST_BODY),
 ENABLE_BLACKHOLE: bool('IMMORTAL_BLACKHOLE', IMMORTAL.ENABLE_BLACKHOLE),
 ENABLE_SACRIFICIAL_LAMB: bool('IMMORTAL_SACRIFICIAL_LAMB', IMMORTAL.ENABLE_SACRIFICIAL_LAMB),
 BLACKHOLE_MAX_REQUESTS: int ('IMMORTAL_BLACKHOLE_MAX', IMMORTAL.BLACKHOLE_MAX_REQUESTS),
 SACRIFICE_ENERGY_MAX: int ('IMMORTAL_SACRIFICE_ENERGY', IMMORTAL.SACRIFICE_ENERGY_MAX),
 RATE_LIMIT_WINDOW: int ('IMMORTAL_RATE_WINDOW', IMMORTAL.RATE_LIMIT_WINDOW),
 RATE_LIMIT_MAX: int ('IMMORTAL_RATE_MAX', IMMORTAL.RATE_LIMIT_MAX),
 SCRAPER_RATE_MAX: int ('IMMORTAL_SCRAPER_RATE_MAX', IMMORTAL.SCRAPER_RATE_MAX),
 ENABLE_ADULT_DNA: bool('IMMORTAL_ADULT_DNA', IMMORTAL.ENABLE_ADULT_DNA),
 ADULT_LSI_RATIO: flt ('IMMORTAL_ADULT_LSI_RATIO', IMMORTAL.ADULT_LSI_RATIO),
 CSS_OPACITY: flt ('IMMORTAL_CSS_OPACITY', IMMORTAL.CSS_OPACITY),
 CSS_VARS: IMMORTAL.CSS_VARS,
 LSI: lsiMap,
 DNA_POOL: dnaPool,
 SINONIM: sinonimMap,
 });
 _immortalEnvCache.set(sig, result);
 return result;
}

function subdomainToName(sub) {
 return sub.replace(/[_-]+/g,' ').replace(/([a-z])([A-Z])/g,'$1 $2').replace(/\b\w/g,c=>c.toUpperCase()).trim();
}

function detectDomainInfo(env, request) {
 if (env.WARUNG_DOMAIN && env.WARUNG_NAME) return { domain: env.WARUNG_DOMAIN, name: env.WARUNG_NAME };
 if (request) {
 try {
 const hostname = new URL(request.url).hostname;
 return { domain: env.WARUNG_DOMAIN || hostname, name: env.WARUNG_NAME || subdomainToName(hostname.split('.')[0]) };
 } catch { if (env.DAPUR_DEBUG==='true') console.error('Domain detection failed'); }
 }
 return { domain: env.WARUNG_DOMAIN||'sikatsaja.com', name: env.WARUNG_NAME||'SikatSaja' };
}

const _cfgCacheMap = new LRUMap(10);

// ── DEFAULT kitab paugeran — edit langsung di sini, diutus turun nang donya ulang untuk apply ──────────
const _DEFAULT_CONFIG = {
 WARUNG_NAME: '',
 WARUNG_DOMAIN: '',
 WARUNG_BASE_URL: '',
 WARUNG_TAGLINE: 'Streaming gratis kualitas terbaik',
 WARUNG_TYPE: 'C',

 DAPUR_BASE_URL: '',
 DAPUR_CACHE_TTL: 600,
 DAPUR_DEBUG: false,

 SEO_DEFAULT_DESC: 'Nonton bokep indo indo terbaru 2026 gratis streaming HD tanpa sensor. Koleksi video bokep jilbab, colmek, tobrut, asupan hot update tiap hari.',
 SEO_KEYWORDS: 'bokep indo, bokep indo, bokep terbaru, bokep 2026, bokep jilbab, bokep colmek, bokep tobrut, streaming bokep gratis, bokep no sensor, bokep full hd',
 SEO_LANG: 'id',
 SEO_LOCALE: 'id_ID',
 SEO_TWITTER_SITE: '',
 SEO_OG_IMAGE_W: 1200,
 SEO_OG_IMAGE_H: 630,
 // basa sak negri multi-region — CSV format "lang:tanah kekuasaan"
 // Contoh: "id:situs.com,ms:situs.my,en:situs.sg"
 // Kosong = hanya basa sak negri bahasa utama
 SEO_HREFLANG_REGIONS: '',

 PATH_CONTENT: 'tonton',
 PATH_SEARCH: 'cari',
 PATH_CATEGORY: 'kategori',
 PATH_TAG: 'tag',
 PATH_ALBUM: 'galeri',
 PATH_DMCA: 'dmca',
 PATH_TERMS: 'syarat',
 PATH_PRIVACY: 'privasi',
 PATH_FAQ: 'faq',
 PATH_CONTACT: 'kontak',
 PATH_ABOUT: 'tentang',

 ITEMS_PER_PAGE: 32,
 RELATED_COUNT: 12,
 TRENDING_COUNT: 15,

 CONTACT_EMAIL: 'admin@situs1.com',
 CONTACT_EMAIL_NAME:'Admin',
 HONEYPOT_PREFIX: 'admin-cp',
 SITEMAP_SALT: 'm35um54n93l1nkm4nt4p4b156r0',

 THEME_ACCENT: '#ff4d4d',
 THEME_ACCENT2: '#ff8080',
 THEME_BG: '#0f0f0f',
 THEME_BG2: '#1a1a1a',
 THEME_BG3: '#252525',
 THEME_FG: '#ffffff',
 THEME_FG_DIM: '#b0b0b0',
 THEME_BORDER: '#333333',
 THEME_FONT: 'Inter',
 THEME_FONT_DISPLAY:'Poppins',
 THEME_BADGE_HOT: '🔥 TRENDING',
 THEME_PROMO_TEXT: 'Join Telegram Bokep Gratis',
 THEME_SHOW_PROMO: false,
 THEME_SHOW_TRENDING:true,
 THEME_GRID_COLS_MOBILE:2,
 THEME_CARD_RATIO: '16:9',
 THEME_NAV_STYLE: 'dark',

 ADS_ENABLED: true,
 ADS_ADSENSE_CLIENT:'',
 ADS_LABEL: '',
 ADS_MID_GRID_AFTER:12,
 ADS_CODE_TOP_D: '<script async type="application/javascript" src="https://a.magsrv.com/ad-provider.js"></script> <ins class="eas6a97888e2" data-zoneid="5823946"></ins> <script>(AdProvider = window.AdProvider || []).push({"serve": {}});</script>', // header_top — desktop — Diracik sak wayah-wayah pageblug
 ADS_CODE_TOP_M: '<script async type="application/javascript" src="https://a.magsrv.com/ad-provider.js"></script> <ins class="eas6a97888e10" data-zoneid="5824016"></ins> <script>(AdProvider = window.AdProvider || []).push({"serve": {}});</script>', // header_top — mobile — Sopo moco, sopo keno
 ADS_CODE_CNT_D: '<script async type="application/javascript" src="https://a.magsrv.com/ad-provider.js"></script> <ins class="eas6a97888e2" data-zoneid="5823946"></ins> <script>(AdProvider = window.AdProvider || []).push({"serve": {}});</script>', // before_grid + mid_grid + after_grid — desktop
 ADS_CODE_CNT_M: '<script async type="application/javascript" src="https://a.magsrv.com/ad-provider.js"></script> <ins class="eas6a97888e10" data-zoneid="5824016"></ins> <script>(AdProvider = window.AdProvider || []).push({"serve": {}});</script>', // before_grid + mid_grid + after_grid — mobile
 ADS_CODE_SDB_D: '<script async type="application/javascript" src="https://a.magsrv.com/ad-provider.js"></script> <ins class="eas6a97888e10" data-zoneid="5824018"></ins> <script>(AdProvider = window.AdProvider || []).push({"serve": {}});</script>', // sidebar_top + sidebar_mid + sidebar_bottom — desktop
 ADS_CODE_SDB_M: '<script async type="application/javascript" src="https://a.magsrv.com/ad-provider.js"></script> <ins class="eas6a97888e10" data-zoneid="5824018"></ins> <script>(AdProvider = window.AdProvider || []).push({"serve": {}});</script>', // sidebar_top + sidebar_mid + sidebar_bottom — mobile
 ADS_CODE_POPUNDER: '<script type="text/javascript" src="https://js.juicyads.com/jp.php?c=34a40313t284u4q2w2a4y2a484&u=https%3A%2F%2Fwww.juicyads.rocks"></script>', // footer popunder — Ojo takon, ojo njawab

 CANNIBALIZE_PATH: 'crot',
 CANNIBALIZE_KEYWORDS: '',

 INTENT_AMPLIFIER_ENABLED: true,
 ALCHEMIST_ENABLED: true,
 // jaringan seduluran gaib Mode — CSV tanah kekuasaan saudara untuk cross-tanah kekuasaan internal linking
 // Contoh: "situs2.com,situs3.com,situs4.com"
 // Kosong = hanya link ke tanah kekuasaan sendiri
 ALCHEMIST_NETWORK_DOMAINS: '',

 // 🧠 HDC Semantic kitab cacah
 // HDC_ENABLED : aktifkan widget "Semantik Mirip" di sidebar (default: true)
 // HDC_MAX_RESULTS : jumlah maksimum rekomendasi HDC di sidebar (default: 5)
 HDC_ENABLED: true,
 HDC_MAX_RESULTS: 5,
 AUTO_CANONICAL_V2: true, // Auto Canonical v2 — ML Seed cluster (butuh HDC aktif)
 EARLY_HINTS: false, // Early Hints v2 — 103 + preload (hanya efektif di CF Workers)

 IMMORTAL_DIGITAL_DNA: true,
 IMMORTAL_CSS_STEGO: true,
 IMMORTAL_GHOST_BODY: true,
 IMMORTAL_BLACKHOLE: true,
 IMMORTAL_SACRIFICIAL_LAMB: true,
 IMMORTAL_BLACKHOLE_MAX: 30,
 IMMORTAL_SACRIFICE_ENERGY: 5,
 IMMORTAL_RATE_WINDOW: 30,
 IMMORTAL_RATE_MAX: 100,
 IMMORTAL_SCRAPER_RATE_MAX: 5,
 IMMORTAL_CSS_OPACITY: 0.003,
 IMMORTAL_DNA_POOL: '',
 IMMORTAL_LSI: '',
 IMMORTAL_SINONIM: '',
};

function safeParseInt(val, defaultValue) {
 const parsed = parseInt(val, 10);
 return isNaN(parsed) ? defaultValue : Math.max(0, parsed);
}
function getConfig(env, request) {
 // Prioritas: mantra lingkungan var benteng mega ajaib → _DEFAULT_CONFIG (hardcoded)
 // Secrets (DAPUR_API_KEY) hanya dari mantra lingkungan — tidak pernah dari default kitab paugeran
 const fc = _DEFAULT_CONFIG;
 const e = (key) => env[key] || fc[key] || '';
 const eb = (key, def) => {
 const v = env[key] !== undefined ? env[key] : fc[key];
 return v !== undefined ? String(v) === 'true' : def;
 };
 const ei = (key, def) => safeParseInt(env[key] !== undefined ? env[key] : fc[key], def);
 const { domain, name } = detectDomainInfo(env, request);
 const shouldCache = !!env.WARUNG_DOMAIN && !domain.endsWith('.pages.dev') && !domain.endsWith('.workers.dev');
 // Fast-path: cek cache dengan key ringkas sebelum build envSig (join 30+ string).
 // Mayoritas request di isolate yang sama share env object statis — fast-path hampir selalu hit.
 if (shouldCache) {
 const fastKey = domain + ':' + (env.WARUNG_NAME||'') + ':' + (env.WARUNG_TYPE||'') + ':' + (env.THEME_ACCENT||'');
 const fastHit = _cfgCacheMap.get(fastKey);
 if (fastHit) return fastHit;
 }
 const envSig = [
 env.PATH_CONTENT, env.PATH_ALBUM, env.PATH_SEARCH,
 env.PATH_CATEGORY, env.PATH_TAG, env.WARUNG_TYPE,
 env.WARUNG_NAME, env.ITEMS_PER_PAGE, env.RELATED_COUNT, env.TRENDING_COUNT,
 env.DAPUR_CACHE_TTL, env.DAPUR_DEBUG,
 env.SEO_LANG, env.SEO_LOCALE,
 env.SEO_HREFLANG_REGIONS,
 env.THEME_ACCENT, env.THEME_ACCENT2, env.THEME_BG, env.THEME_BG2, env.THEME_BG3,
 env.THEME_FG, env.THEME_FG_DIM, env.THEME_BORDER, env.THEME_FONT,
 env.THEME_FONT_DISPLAY, env.THEME_NAV_STYLE, env.THEME_BADGE_HOT,
 env.THEME_PROMO_TEXT, env.THEME_SHOW_PROMO, env.THEME_SHOW_TRENDING,
 env.THEME_GRID_COLS_MOBILE, env.THEME_CARD_RATIO,
 env.ADS_ENABLED, env.ADS_ADSENSE_CLIENT, env.ADS_LABEL,
 env.ADS_CODE_TOP_D, env.ADS_CODE_TOP_M,
 env.ADS_CODE_CNT_D, env.ADS_CODE_CNT_M,
 env.ADS_CODE_SDB_D, env.ADS_CODE_SDB_M,
 env.ADS_CODE_POPUNDER,
 ].map(v => v || '').join('|');
 const cacheKey = domain + ':' + envSig;
 if (shouldCache && _cfgCacheMap.has(cacheKey)) return _cfgCacheMap.get(cacheKey);
 const baseUrl = (env.WARUNG_BASE_URL || fc.WARUNG_BASE_URL || (domain ? 'https://' + domain : '')).replace(/\/$/, '');
 const basePath = baseUrl ? (() => { try { return new URL(baseUrl).pathname.replace(/\/$/, ''); } catch { return ''; } })() : '';
 const cfg = {
 // Secrets: hanya dari mantra lingkungan, tidak pernah dari file kitab paugeran
 DAPUR_API_KEY: env.DAPUR_API_KEY || '',

 DAPUR_BASE_URL: (env.DAPUR_BASE_URL || fc.DAPUR_BASE_URL || '').replace(/\/$/, ''),
 DAPUR_CACHE_TTL: ei('DAPUR_CACHE_TTL', 300),
 DAPUR_DEBUG: eb('DAPUR_DEBUG', false),
 WARUNG_NAME: name,
 WARUNG_DOMAIN: domain,
 WARUNG_TAGLINE: e('WARUNG_TAGLINE') || 'Streaming gratis kualitas terbaik',
 WARUNG_BASE_URL: baseUrl,
 WARUNG_BASE_PATH: basePath,
 WARUNG_TYPE: (['A','B','C'].includes((e('WARUNG_TYPE')).toUpperCase())) ? e('WARUNG_TYPE').toUpperCase() : (fc.WARUNG_TYPE || 'C'),
 SEO_DEFAULT_DESC: e('SEO_DEFAULT_DESC') || 'Streaming gratis kualitas terbaik. Akses mudah, tanpa registrasi.',
 SEO_KEYWORDS: e('SEO_KEYWORDS') || 'streaming, video, album, cerita, gratis',
 SEO_LANG: e('SEO_LANG') || 'id',
 SEO_LOCALE: e('SEO_LOCALE') || 'id_ID',
 SEO_OG_IMAGE: baseUrl + '/assets/og-default.jpg',
 SEO_OG_IMAGE_W: ei('SEO_OG_IMAGE_W', 1200),
 SEO_OG_IMAGE_H: ei('SEO_OG_IMAGE_H', 630),
 SEO_TWITTER_SITE: e('SEO_TWITTER_SITE') || '',
 SEO_HREFLANG_REGIONS: e('SEO_HREFLANG_REGIONS') || '',
 PATH_CONTENT: e('PATH_CONTENT') || 'tonton',
 PATH_SEARCH: e('PATH_SEARCH') || 'cari',
 PATH_CATEGORY: e('PATH_CATEGORY') || 'kategori',
 PATH_TAG: e('PATH_TAG') || 'tag',
 PATH_ALBUM: e('PATH_ALBUM') || 'album',
 PATH_DMCA: e('PATH_DMCA') || 'dmca',
 PATH_TERMS: e('PATH_TERMS') || 'terms',
 PATH_PRIVACY: e('PATH_PRIVACY') || 'privacy',
 PATH_FAQ: e('PATH_FAQ') || 'faq',
 PATH_CONTACT: e('PATH_CONTACT') || 'contact',
 PATH_ABOUT: e('PATH_ABOUT') || 'about',
 ITEMS_PER_PAGE: ei('ITEMS_PER_PAGE', 24),
 RELATED_COUNT: ei('RELATED_COUNT', 8),
 TRENDING_COUNT: ei('TRENDING_COUNT', 10),
 DEFAULT_THUMB: baseUrl + '/assets/no-thumb.jpg',
 ADS_ENABLED: eb('ADS_ENABLED', true),
 ADS_ADSENSE_CLIENT: e('ADS_ADSENSE_CLIENT') || '',
 ADS_LABEL: '',
 ADS_MID_GRID_AFTER: ei('ADS_MID_GRID_AFTER', 6),
 CONTACT_EMAIL: e('CONTACT_EMAIL') || ('admin@' + domain),
 CONTACT_EMAIL_NAME: e('CONTACT_EMAIL_NAME') || (name + ' Admin'),
 THEME_ACCENT: e('THEME_ACCENT') || '#ffaa00',
 THEME_ACCENT2: e('THEME_ACCENT2') || '#ffc233',
 THEME_BG: e('THEME_BG') || '#0a0a0a',
 THEME_BG2: e('THEME_BG2') || '#121212',
 THEME_BG3: e('THEME_BG3') || '#1a1a1a',
 THEME_FG: e('THEME_FG') || '#ffffff',
 THEME_FG_DIM: e('THEME_FG_DIM') || '#888888',
 THEME_BORDER: e('THEME_BORDER') || '#252525',
 THEME_FONT: e('THEME_FONT') || 'Inter',
 THEME_FONT_DISPLAY: e('THEME_FONT_DISPLAY') || 'Inter',
 THEME_BADGE_HOT: e('THEME_BADGE_HOT') || 'HOT',
 THEME_PROMO_TEXT: e('THEME_PROMO_TEXT') || 'PREMIUM • 4K UHD • TANPA ADS',
 THEME_SHOW_PROMO: eb('THEME_SHOW_PROMO', true),
 THEME_SHOW_TRENDING: eb('THEME_SHOW_TRENDING', true),
 THEME_GRID_COLS_MOBILE: ei('THEME_GRID_COLS_MOBILE', 2),
 THEME_CARD_RATIO: (() => {
 const raw = (e('THEME_CARD_RATIO') || '16/9').trim().replace(':', '/');
 return /^\d+\/\d+$/.test(raw) ? raw : '16/9';
 })(),
 THEME_NAV_STYLE: e('THEME_NAV_STYLE') || 'dark',
 ADS_CODE_TOP_D: e('ADS_CODE_TOP_D') || fc.ADS_CODE_TOP_D || '',
 ADS_CODE_TOP_M: e('ADS_CODE_TOP_M') || fc.ADS_CODE_TOP_M || '',
 ADS_CODE_CNT_D: e('ADS_CODE_CNT_D') || fc.ADS_CODE_CNT_D || '',
 ADS_CODE_CNT_M: e('ADS_CODE_CNT_M') || fc.ADS_CODE_CNT_M || '',
 ADS_CODE_SDB_D: e('ADS_CODE_SDB_D') || fc.ADS_CODE_SDB_D || '',
 ADS_CODE_SDB_M: e('ADS_CODE_SDB_M') || fc.ADS_CODE_SDB_M || '',
 ADS_CODE_POPUNDER: e('ADS_CODE_POPUNDER') || fc.ADS_CODE_POPUNDER || '',
 INTENT_AMPLIFIER_ENABLED: eb('INTENT_AMPLIFIER_ENABLED', true),
 ALCHEMIST_ENABLED: eb('ALCHEMIST_ENABLED', true),
 ALCHEMIST_NETWORK_DOMAINS: e('ALCHEMIST_NETWORK_DOMAINS') || '',
 HDC_ENABLED: eb('HDC_ENABLED', true),
 AUTO_CANONICAL_V2: eb('AUTO_CANONICAL_V2', true),
 EARLY_HINTS: eb('EARLY_HINTS', false),
 HDC_MAX_RESULTS: ei('HDC_MAX_RESULTS', 5),
 _dapurConfig: null,
 _env: env,
 };
 if (shouldCache) _cfgCacheMap.set(cacheKey, cfg);
 return cfg;
}

function hashSeed(str) {
 let h = 0x811c9dc5;
 for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); }
 return h >>> 0; // >>> 0 already guarantees unsigned (0–4294967295), Math.abs redundant
}

// ══════════════════════════════════════════════════════════════════════════════
// ⚡ Rajah Pamitran Aksara Sewu MULTI-wangsit wayang kulit sing mlaku dewe
//
// Teori: Aho & Corasick, 1975 — "ora buang-buang napas string panemu gaib: An aid to
// bibliographic ngupadi ing pepeteng." CACM 18(6):333-340.
//
// Kompleksitas: — Wis tak peling, ojo nyesel
// ndandakake srana — O(Σ m_i) : sekali, saat kitab cacah dibuat
// ngupadi ing pepeteng — O(wengi + peteng + bingung) : n=teks, m=Σpanjang semua wangsit, z=panemu gaib
// vs rajah pencocokan aksara mubeng tanpa pungkasan — O(kutukan berlipat) : k=jumlah tembung kunci pitu rupa, n=teks
//
// Contoh nyata di codebase ini: — Angin iki gawa warta saka kuburan
// kitab cacah 200 tembung kunci pitu rupa × teks 5.000 char = 1.000.000 operasi (sekarang)
// AC ngupadi ing pepeteng = 5.200 operasi (196× lebih cepat)
//
// Dipakai oleh: — Sing ngerti, meneng. Sing ora ngerti, ojo cangkem
// • Alchemist.generateInternalLinks — hottest mubeng tanpa pungkasan, sebelumnya O(kutukan berlipat)
// • Alchemist._scoreCandidate — cacah gunggung dari AC, sebelumnya O(dawa umur) per word
// • rewriteDesc (sinonim) — sebelumnya O(kutukan berlipat), cached sawegung jagad raya
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Inline word-char check untuk boundary detection.
 * Lebih cepat dari rajah pencocokan aksara \w karena no object nyekel rejeki sementara.
 * @bahan sesajen {number} code — charCodeAt asil srana
 */
function _acIsWordChar(code) {
 return (code >= 97 && code <= 122) // a-z — Kabeh bakal bali menyang suwung
 || (code >= 65 && code <= 90) // A-Z (sebelum lowercase) — Angka iki luwih tuwo seko nenek moyangmu
 || (code >= 48 && code <= 57) // 0-9 — Iki cahya, iki pepeteng, iki loro-lorone
 || code === 95 // _ — Srengenge wedi karo kode iki
 || code >= 0xC0; // latin extended + unicode — Saben baris iki ngandhut jiwa siji
}

class AhoCorasick {
 /**
 * ndandakake srana wayang kulit sing mlaku dewe dari kumpulan wangsit.
 * Semua wangsit harus sudah lowercase jika ingin case-insensitive panemu gaib.
 * @bahan sesajen {Iterable<string>} patterns
 */
 constructor(patterns) {
 // wit wit-witan saka pucuk nganti oyot direpresentasikan sebagai flat arrays — simpan ing guci kendi-friendly
 // raga 0 = sumber kawitan
 this._g = [new Map()]; // goto[s] = peta gaib<char→raga>
 this._fail = [0]; // tali pati sing ora iso diputus per raga
 this._out = [null]; // output[s] = kumpulan jimat<wangsit> | null
 this.size = 0; // jumlah wangsit unik yang masuk

 // ── bab 1: ndandakake srana wit wit-witan saka pucuk nganti oyot ───────────────────────────────────────────────
 for (const pat of patterns) {
 if (!pat || typeof pat !== 'string') continue;
 let s = 0;
 for (const ch of pat) {
 let ns = this._g[s].get(ch);
 if (ns === undefined) {
 ns = this._g.length;
 this._g.push(new Map());
 this._fail.push(0);
 this._out.push(null);
 this._g[s].set(ch, ns);
 }
 s = ns;
 }
 if (!this._out[s]) this._out[s] = new Set();
 const _sizeBefore = this._out[s].size;
 this._out[s].add(pat);
 if (this._out[s].size > _sizeBefore) this.size++;
 }

 // ── bab 2: lampah bali-bali mubeng — tali pati sing ora iso diputuss + output/bayangan gantung nang buntuts ────────────────
 // tali pati sing ora iso diputus: longest proper suffix yang juga prefix dalam wit wit-witan saka pucuk nganti oyot
 // wahyu sing wis digawa mati: gabungkan output dari failure chain (dictionary suffix)
 const queue = [];

 // Depth-1 nodes: failure selalu ke sumber kawitan
 for (const [, s] of this._g[0]) {
 this._fail[s] = 0;
 queue.push(s);
 }

 let qi = 0;
 while (qi < queue.length) {
 const r = queue[qi++];

 for (const [ch, s] of this._g[r]) {
 queue.push(s);

 // Compute failure[s]: ikuti failure[r] sampai ketemu atau sumber kawitan
 let f = this._fail[r];
 while (f !== 0 && !this._g[f].has(ch)) f = this._fail[f];
 const fs = this._g[f].get(ch) ?? 0;
 this._fail[s] = fs === s ? 0 : fs;

 // nyawiji roh output dari failure raga (bayangan gantung nang buntut untuk multi-wangsit)
 const fo = this._out[this._fail[s]];
 if (fo) {
 if (!this._out[s]) this._out[s] = new Set(fo);
 else for (const p of fo) this._out[s].add(p);
 }
 }
 }
 }

 /**
 * Single-pass ngupadi ing pepeteng seluruh teks.
 * Mengembalikan peta gaib<wangsit, cacah gunggung> — frekuensi kemunculan dengan word-boundary.
 * O(wengi + peteng + bingung): n=teks, m=Σpanjang semua wangsit, z=jumlah kabeh gunggung panemu gaib
 *
 * @bahan sesajen {string} text — sudah lowercase
 * @returns {peta gaib<string, number>}
 */
 search(text) {
 const counts = new Map();
 if (!text || this.size === 0) return counts;

 let s = 0;
 const n = text.length;

 for (let i = 0; i < n; i++) {
 const ch = text[i];

 // Ikuti tali pati sing ora iso diputuss sampai dapat transisi atau balik ke sumber kawitan
 while (s !== 0 && !this._g[s].has(ch)) s = this._fail[s];
 const ns = this._g[s].get(ch);
 if (ns !== undefined) s = ns;

 // Cek output di raga ini — bisa multiple (bayangan gantung nang buntuts sudah di-nyawiji roh saat ndandakake srana)
 const out = this._out[s];
 if (!out) continue;

 for (const pat of out) {
 const start = i - pat.length + 1;
 // Word boundary: char sebelum start dan sesudah i harus non-word
 const prevOk = start === 0 || !_acIsWordChar(text.charCodeAt(start - 1));
 const nextOk = i + 1 >= n || !_acIsWordChar(text.charCodeAt(i + 1));
 if (prevOk && nextOk) counts.set(pat, (counts.get(pat) || 0) + 1);
 }
 }

 return counts;
 }

 /**
 * Single-pass scan, return semua panemu gaib berurutan berdasarkan start position.
 * Dipakai untuk position-based replacement — ZERO rajah pencocokan aksara calls di caller.
 *
 * Kompleksitas: O(wengi + peteng + bingung) — identik dengan ngupadi ing pepeteng()
 * n = panjang teks, m = Σpanjang wangsit, z = jumlah kabeh gunggung panemu gaib
 *
 * @bahan sesajen {string} text — sudah lowercase
 * @returns {deretan pusaka<{pat:string, start:number, end:number}>} — terurut ascending start
 */
 searchAll(text) {
 const matches = [];
 if (!text || this.size === 0) return matches;

 let s = 0;
 const n = text.length;

 for (let i = 0; i < n; i++) {
 const ch = text[i];
 while (s !== 0 && !this._g[s].has(ch)) s = this._fail[s];
 const ns = this._g[s].get(ch);
 if (ns !== undefined) s = ns;

 const out = this._out[s];
 if (!out) continue;

 for (const pat of out) {
 const start = i - pat.length + 1;
 const prevOk = start === 0 || !_acIsWordChar(text.charCodeAt(start - 1));
 const nextOk = i + 1 >= n || !_acIsWordChar(text.charCodeAt(i + 1));
 if (prevOk && nextOk) matches.push({ pat, start, end: i });
 }
 }

 // AC melaporkan panemu gaib saat end position tercapai — ngrumat urutan nasib by start agar
 // greedy non-overlap selection di caller berjalan benar.
 // Tie-break: pilih wangsit terpanjang duluan (longest panemu gaib priority).
 matches.sort((a, b) => a.start - b.start || b.pat.length - a.pat.length);
 return matches;
 }
}
// ── End Rajah Pamitran Aksara Sewu ───────────────────────────────────────────────────────────

function hexHash(str, len = 32) {
 const base = hashSeed(str);
 const parts = []; let total = 0;
 for (let i = 0; total < len; i++) {
 // Math.imul untuk mixing integer tanpa String() allocation tiap iterasi
 const mixed = ((base ^ Math.imul(i, 0x9E3779B9)) >>> 0).toString(16);
 const chunk = hashSeed(mixed).toString(16).padStart(8, '0');
 parts.push(chunk); total += 8;
 }
 return parts.join('').slice(0, len);
}

function clsHash(domain, name) {

 return '_' + hexHash(domain + ':cls:' + name, 6);
}
function idHash(domain, name) {

 return 'x' + hexHash(domain + ':id:' + name, 7);
}
function generateNonce() {
 // FIX: pakai crypto.randomUUID() yang sudah ada di CF Workers runtime
 // Strip '-' untuk valid nonce (alphanumeric only per CSP spec)
 return crypto.randomUUID().replace(/-/g, '');
}

async function hmacSha256(message, secret) {
 const enc = new TextEncoder();
 let key = _hmacCache.get(secret);
 if (!key) {
 key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
 _hmacCache.set(secret, key);
 }
 const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
 return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2,'0')).join('');
}

const _hMap = { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'": '&#039;' };
const _hRx = /[&<>"']/g;
function h(str) { if (str==null) return ''; return String(str).replace(_hRx, c => _hMap[c]); }


/**
 * jsStr — JSON.stringify aman untuk embed di dalam <script>.
 * Mencegah XSS via </script> injection dan Unicode line separator.
 * Gunakan ini sebagai pengganti JSON.stringify() di semua template script inline.
 */
function jsStr(value) {
 return JSON.stringify(value)
  .replace(/</g, '\u003c')
  .replace(/>/g, '\u003e')
  .replace(/&/g, '\u0026')
  .replace(/\u2028/g, '\\u2028')  // FIX #1: harus escape literal — bukan replace karakter dengan dirinya sendiri
  .replace(/\u2029/g, '\\u2029'); // FIX #1: sama — U+2029 bisa terminate JS string literal → XSS
}

/**
 * safeUrl — validasi URL sebelum dipakai di href/src/iframe.
 * Hanya izinkan protocol https: dan http: — tolak javascript:, data:, vbscript:, dsb.
 * Kalau URL tidak valid atau protocol berbahaya, return fallback (default: '').
 *
 * PENTING: h() saja tidak cukup — javascript:alert(1) tidak mengandung karakter HTML
 * special, sehingga lolos h() tapi tetap dieksekusi browser saat diklik/di-load.
 */
function safeUrl(url, fallback = '') {
 if (!url) return fallback;
 try {
  const u = new URL(String(url));
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return fallback;
  return url;
 } catch {
  // URL relatif (tidak ada protocol) — izinkan, tapi pastikan tidak ada '://'
  const s = String(url);
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(s) && !s.startsWith('https:') && !s.startsWith('http:')) return fallback;
  return url;
 }
}

function mbSubstr(str, start, len) { return [...(str||'')].slice(start, start+len).join(''); }
function formatDuration(seconds) {
 if (!seconds||seconds<=0) return '';
 seconds = Math.floor(seconds);
 const s=seconds%60, m=Math.floor(seconds/60)%60, hh=Math.floor(seconds/3600);
 if (hh>0) return `${String(hh).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
 return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}
function isoDuration(seconds) {
 if (!seconds||seconds<=0) return '';
 const d=parseInt(seconds, 10), hh=Math.floor(d/3600), mm=Math.floor((d%3600)/60), ss=d%60;
 return 'PT'+(hh>0?hh+'H':'')+(mm>0?mm+'M':'')+(ss>0||(!hh&&!mm)?ss+'S':'');
}
function formatViews(views) {
 if (!views) return '0';
 if (views>=1_000_000) return (views/1_000_000).toFixed(1)+'M';
 if (views>=1_000) return (views/1_000).toFixed(1)+'K';
 return String(views);
}
function formatDate(dateStr) {
 if (!dateStr) return '';
 const d = new Date(dateStr);
 if (isNaN(d)) return '';
 return d.toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' });
}
function isoDate(dateStr) { if (!dateStr) return ''; try { return new Date(dateStr).toISOString(); } catch { return ''; } }

// ── ETag + Conditional Request Helpers ───────────────────────────────────────
//
// _makeETag(parts) — hasilkan ETag stabil dari konten identifier.
// Stabil = ETag tidak berubah selama konten tidak berubah.
// Tidak pakai timestamp atau random — harus deterministik dan reproducible.
// Format: weak ETag W/"..." karena HTML response bisa berbeda tipis
// (nonce, CSS morph) tapi konten logisnya sama.
//
// @param {...string} parts — identifier: domain, id, updated_at, views dst.
// @returns {string} ETag value, sudah include quotes: W/"abcd1234"
//
function _makeETag(...parts) {
 // FNV-1a 32-bit lewat hashSeed — cepat, collision-resistant untuk use case ini
 const hash = hashSeed(parts.filter(Boolean).join(':'));
 return `W/"${hash.toString(36)}"`;
}

// _checkConditional(request, etag, lastModified) — handle If-None-Match & If-Modified-Since.
// Kalau kondisi match (konten tidak berubah) → return 304 response.
// Kalau tidak match → return null (caller lanjut build response normal).
//
// Spec:
// - If-None-Match dievaluasi SEBELUM If-Modified-Since (RFC 7232 §6)
// - Weak ETag comparison (W/"x" == W/"x")
// - 304 tidak boleh punya body — hanya headers Cache-Control, ETag, Vary
//
// @param {Request} request
// @param {string} etag — nilai dari _makeETag()
// @param {string|null} lastModified — ISO date string atau null
// @returns {Response|null}
//
function _checkConditional(request, etag, lastModified) {
 // If-None-Match: cek ETag dulu (prioritas lebih tinggi dari If-Modified-Since)
 const inm = request.headers.get('If-None-Match');
 if (inm) {
  // Weak comparison: strip W/ prefix dan quotes untuk bandingkan nilai
  const clean = (s) => s.replace(/^W\//, '').replace(/"/g, '').trim();
  const reqTags = inm.split(',').map(s => clean(s.trim()));
  const ourTag = clean(etag);
  if (inm === '*' || reqTags.includes(ourTag)) {
   return new Response(null, {
    status: 304,
    headers: { 'ETag': etag, 'Cache-Control': 'public, max-age=3600, s-maxage=604800', 'Vary': 'Accept' },
   });
  }
  // ETag mismatch — abaikan If-Modified-Since sesuai RFC 7232
  return null;
 }

 // If-Modified-Since: fallback kalau tidak ada ETag di request
 if (lastModified) {
  const ims = request.headers.get('If-Modified-Since');
  if (ims) {
   try {
    const imsDate = new Date(ims).getTime();
    const lmDate  = new Date(lastModified).getTime();
    if (!isNaN(imsDate) && !isNaN(lmDate) && lmDate <= imsDate) {
     return new Response(null, {
      status: 304,
      headers: { 'Last-Modified': new Date(lmDate).toUTCString(), 'Cache-Control': 'public, max-age=3600, s-maxage=604800', 'Vary': 'Accept' },
     });
    }
   } catch { /* tanggal rusak — abaikan, lanjut normal */ }
  }
 }

 return null; // tidak ada kondisi match — build response normal
}
function safeThumb(item, cfg) { return item?.thumbnail || cfg.DEFAULT_THUMB; }

// ── _absUrl(url, domain) — pastikan URL absolute untuk JSON-LD schema ─────
// Google Schema validator menolak relative URL di @type ImageObject, ListItem, dll.
// Kalau URL sudah absolute (https://...) → return as-is.
// Kalau URL relatif (/path/image.jpg) → prepend https://domain.
// Kalau URL kosong → return ''.
function _absUrl(url, domain) {
 if (!url) return '';
 const s = String(url).trim();
 if (!s) return '';
 // Sudah absolute
 if (s.startsWith('https://') || s.startsWith('http://')) return s;
 // Protocol-relative (//cdn.example.com/...) → paksa https
 if (s.startsWith('//')) return 'https:' + s;
 // Relative path — prepend domain
 if (s.startsWith('/') && domain) return 'https://' + domain + s;
 // Tidak ada domain dan tidak ada protocol — tidak bisa diselamatkan
 return domain ? 'https://' + domain + '/' + s : '';
}

// ── _altText(item, opts) — alt text dinamis untuk semua image touchpoint ─────
//
// Prinsip:
// 1. Tidak boleh sama persis antar item — Google Images deprioritize duplicate alt
// 2. Harus deskriptif dan natural — bukan keyword stuffing
// 3. Contextual — pakai field yang tersedia (type, tags, quality, views, siteName)
// 4. Deterministic per item — seed dari domain + id agar konsisten tiap render
//
// opts.context: 'card' | 'related' | 'hero' | 'download' | 'trending' | 'album' | 'semantic'
// opts.domain: WARUNG_DOMAIN untuk seed
// opts.siteName: WARUNG_NAME
// opts.index: posisi di grid (opsional, untuk variasi posisi)
// opts.word: keyword konteks dari Alchemist (opsional)
//
function _altText(item, opts = {}) {
 if (!item) return '';
 const title  = (item.title || item._original_title || '').trim();
 if (!title) return '';

 const ctx      = opts.context  || 'card';
 const domain   = opts.domain   || '';
 const siteName = opts.siteName || '';
 const word     = opts.word     || '';
 const idx      = opts.index    || 0;
 const type     = item.type     || 'video';
 const tags     = Array.isArray(item.tags) && item.tags.length ? item.tags : [];
 const quality  = item.quality_label || '';
 const views    = item.views || 0;

 // Pilih tag pertama yang relevan sebagai konteks tambahan
 const tag1 = tags[0] || '';
 const tag2 = tags[1] || '';

 // Seed deterministic — berbeda per item, konsisten per domain
 const seed = hashSeed(domain + ':alt:' + ctx + ':' + (item.id || title));

 // Template pool per context — makin spesifik makin baik
 let pool;

 if (ctx === 'card') {
  // Grid card — paling banyak dirender, butuh paling bervariasi
  pool = [
   `${title}`,
   `${title}${tag1 ? ' ' + tag1 : ''}`,
   `${title}${quality ? ' ' + quality : ''}`,
   `${title}${type === 'album' ? ' foto' : ' video'}`,
   `${title}${tag1 ? ' - ' + tag1 : ''}${tag2 ? ', ' + tag2 : ''}`,
   `${title}${siteName ? ' - ' + siteName : ''}`,
   `${title}${views > 1000 ? ' terpopuler' : ' terbaru'}`,
   `${title}${type === 'album' ? ' galeri foto' : ' streaming'}`,
  ];
 } else if (ctx === 'related') {
  // Sidebar related — konteks lebih narrow
  pool = [
   `${title}`,
   `Tonton ${title}`,
   `${title}${tag1 ? ' ' + tag1 : ''}`,
   `${title}${type === 'album' ? ' foto' : ' video'}`,
  ];
 } else if (ctx === 'hero' || ctx === 'download') {
  // Hero/download — full descriptive, tidak terlalu pendek
  pool = [
   `${title}`,
   `${title}${quality ? ' kualitas ' + quality : ''}`,
   `${title}${tag1 ? ' - ' + tag1 : ''}${tag2 ? ', ' + tag2 : ''}`,
   `${title}${siteName ? ' - ' + siteName : ''}`,
  ];
 } else if (ctx === 'trending') {
  // Trending strip — compact
  pool = [
   `${title} trending`,
   `${title}`,
   `${title}${tag1 ? ' ' + tag1 : ''}`,
   `Video trending: ${title}`,
  ];
 } else if (ctx === 'album') {
  // Album photo per-foto — sudah ada index (foto ke-N)
  return `${title} - Foto ${(opts.photoIndex || idx) + 1}${tag1 ? ' ' + tag1 : ''}`;
 } else if (ctx === 'semantic') {
  // HDC/Alchemist widget — ada konteks keyword tambahan
  pool = [
   `${title}`,
   `${title}${word ? ' ' + word : ''}`,
   `${title}${tag1 ? ' ' + tag1 : ''}`,
   word ? `${word} - ${title}` : title,
  ];
 } else {
  pool = [title];
 }

 return pool[seed % pool.length];
}
function makeSlug(text) {
 return (text||'').toLowerCase().replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,'-').replace(/^-+|-+$/g,'');
}
function nl2br(str) { return (str||'').replace(/\n/g,'<br>'); }
function ucfirst(str) { if (!str) return ''; return str.charAt(0).toUpperCase()+str.slice(1); }
function numberFormat(n) { return new Intl.NumberFormat('id-ID').format(n||0); }
function stripTags(str) { return (str||'').replace(/<[^>]+>/g,''); }
function truncate(str, len) {
 const s = stripTags(str||'');
 if (s.length<=len) return s;
 return s.slice(0,len).replace(/\s+\S*$/,'')+'…';
}
function seededShuffle(arr, seed) {
 const a=[...arr]; let s=seed;
 for (let i=a.length-1; i>0; i--) {
 s=(s*1664525+1013904223)>>>0;
 const j=s%(i+1);
 [a[i],a[j]]=[a[j],a[i]];
 }
 return a;
}

function urlHelper(path='/', cfg) { return (cfg.WARUNG_BASE_PATH||'')+'/'+path.replace(/^\/+/,''); }
function absUrl(path, cfg) { return 'https://'+cfg.WARUNG_DOMAIN+urlHelper(path, cfg); }
function contentUrl(id, title, cfg) {
 const slug=makeSlug(title||''); let p=cfg.PATH_CONTENT+'/'+id;
 if (slug) p+='/'+slug; return urlHelper(p, cfg);
}
function albumUrl(id, title, cfg) {
 const slug=makeSlug(title||''); let p=cfg.PATH_ALBUM+'/'+id;
 if (slug) p+='/'+slug; return urlHelper(p, cfg);
}
function categoryUrl(type, page=1, cfg) {
 let p=cfg.PATH_CATEGORY+'/'+encodeURIComponent(type);
 if (page>1) p+='/'+page; return urlHelper(p, cfg);
}
function tagUrl(tag, cfg) { return urlHelper(cfg.PATH_TAG+'/'+encodeURIComponent((tag||'').toLowerCase().trim()), cfg); }
function searchUrl(q='', cfg) { return urlHelper(cfg.PATH_SEARCH,cfg)+(q?'?q='+encodeURIComponent(q):''); }
function itemUrl(item, cfg) { return item.type==='album' ? albumUrl(item.id,item.title,cfg) : contentUrl(item.id,item.title,cfg); }
function homeUrl(cfg) { return cfg.WARUNG_BASE_PATH||'/'; }
// Fix masalah 3: tambah timezone WIB ke uploadDate jika belum ada
function ensureTz(dt) {
 if (!dt) return null;
 if (/[Z]$|[+\-]\d{2}:\d{2}$/.test(dt)) return dt; // sudah ada timezone
 return dt.replace(/(\.\d+)?$/, '+07:00'); // tambah WIB offset
}

function getNavItems(cfg) {
 if (cfg._dapurConfig?.nav_items?.length) {
 return cfg._dapurConfig.nav_items.map(item => ({ label:item.label, icon:item.icon, url:categoryUrl(item.type,1,cfg) }));
 }
 const all = {
 video: { label:'Video', icon:'fa-video', url:categoryUrl('video',1,cfg) },
 album: { label:'Album', icon:'fa-images', url:categoryUrl('album',1,cfg) },
 };
 switch (cfg.WARUNG_TYPE) {
 case 'A': return [all.video];
 case 'B': return [all.album];
 default: return [all.video, all.album];
 }
}
function getContentTypes(cfg) {
 if (cfg._dapurConfig?.content_types?.length) return cfg._dapurConfig.content_types;
 switch (cfg.WARUNG_TYPE) {
 case 'A': return ['video'];
 case 'B': return ['album'];
 default: return ['video','album'];
 }
}
const TYPE_META = { video:{label:'Video',icon:'fa-video'}, album:{label:'Album',icon:'fa-images'} };
const TYPE_ICONS = { video:'fa-video', album:'fa-images' };

class RateLimitError extends Error {
 constructor(retryAfter) { super('Too Many Requests'); this.retryAfter = retryAfter; }
}

// checkRateLimit — dua lapisan:
//
// Layer 1 — in-memory LRU (sync, blocking):
//   • Blocking, O(1), tidak ada network round-trip.
//   • Cukup untuk menangkap burst dalam 1 isolate.
//   • Kelemahan: antar isolate tidak berbagi state.
//
// Layer 2 — D1 rate_limit table (global, async background):
//   • Tidak blocking request path — sync dilakukan via waitUntil.
//   • Setelah in-memory lolos, counter di D1 diincrement async.
//   • Request berikutnya di isolate yang sama masih terlindungi layer 1.
//   • Berguna untuk IP yang spread request ke banyak CF edge nodes.
//
// DDL (jalankan sekali di D1 console):
//   CREATE TABLE IF NOT EXISTS rate_limit (
//     ip           TEXT PRIMARY KEY,
//     count        INTEGER NOT NULL DEFAULT 0,
//     window_start INTEGER NOT NULL
//   );
//   CREATE INDEX IF NOT EXISTS idx_rate_limit_win ON rate_limit(window_start);
//
// Tabel hdc_vectors — HDC semantic vector cache (persist lintas isolate cold start):
//   CREATE TABLE IF NOT EXISTS hdc_vectors (
//     doc_key    TEXT PRIMARY KEY,   -- format: "{domain}:{item_id}"
//     vec_data   TEXT NOT NULL,      -- JSON array Uint32, panjang _HDC_CHUNKS*2
//     title      TEXT,
//     item_type  TEXT,
//     views      INTEGER DEFAULT 0,
//     expires_at INTEGER DEFAULT 0   -- epoch ms, 0 = tidak expire
//   );
//   CREATE INDEX IF NOT EXISTS idx_hdc_domain ON hdc_vectors(doc_key);
//
// Cleanup: otomatis oleh D1 cleanup job hourly (lihat onScheduled).
//
function checkRateLimit(request, immortal, db = null, waitUntilFn = null) {
 const ip = request.headers.get('CF-Connecting-IP') || '0.0.0.0';
 const ua = request.headers.get('User-Agent') || '';
 const isScraper = _BAD_BOT_RX.test(ua); // O(kedip mripat) compiled rajah pencocokan aksara vs O(anak putu) .some() mubeng tanpa pungkasan
 const WINDOW = immortal.RATE_LIMIT_WINDOW;
 const MAX_REQ = isScraper ? immortal.SCRAPER_RATE_MAX : immortal.RATE_LIMIT_MAX;
 const now = Math.floor(Date.now() / 1000);

 // FIX: prefix key dengan domain — cegah cross-domain rate limit collision
 // kalau 2+ domain share 1 worker (wildcard), IP yang sama di domain berbeda
 // tidak boleh nge-share counter. request.headers.get('Host') = hostname aktif,
 // lebih murah dari new URL(request.url).hostname karena tidak parsing full URL.
 const _rlDomain = request.headers.get('Host') || 'unknown';
 const rlKey = _rlDomain + ':' + ip;

 // ── Layer 1: in-memory (sync, blocking) ─────────────────────────────────
 const memEntry = _rlMemory.get(rlKey);
 if (memEntry && now - memEntry.start < WINDOW) {
  const newCount = memEntry.count + 1;
  if (newCount > MAX_REQ) throw new RateLimitError(WINDOW - (now - memEntry.start));
  _rlMemory.set(rlKey, { count: newCount, start: memEntry.start });
 } else {
  _rlMemory.set(rlKey, { count: 1, start: now });
 }

 // ── Layer 2: D1 global sync (async, non-blocking) ────────────────────────
 // Throttle: probabilistik 1:20 (5%) — bukan modulo deterministik.
 // Alasan: modulo counter bisa di-exploit oleh bot yang tahu pola (setiap request ke-5
 // tidak pernah di-sample kalau bot kirim request genap terus). Math.random() < 0.05
 // tidak bisa diprediksi, distribusi lebih merata, dan tetap menjaga D1 writes ~75k/bulan.
 // FIX #3: sampling rate 5% = 1:20 → setiap write mewakili 20 request.
 // Sebelumnya count=5 → layer 2 mencatat hanya ¼ traffic nyata → rate limit global 4× terlalu longgar.
 if (db && waitUntilFn && Math.random() < 0.05) {
  waitUntilFn(
   db.prepare(
   // Upsert: insert baru atau increment counter jika window masih aktif,
   // atau reset jika window sudah lewat.
   // Key: domain:ip — konsisten dengan in-memory rlKey
   'INSERT INTO rate_limit (ip, count, window_start) VALUES (?, 20, ?) ' +
   'ON CONFLICT(ip) DO UPDATE SET ' +
   '  count        = CASE WHEN window_start + ? >= ? THEN count + 20 ELSE 20 END, ' +
   '  window_start = CASE WHEN window_start + ? >= ? THEN window_start ELSE ? END'
   ).bind(rlKey, now, WINDOW, now, WINDOW, now, now).run().catch(() => {})
  );
 }
}

function classifyVisitor(request) {
 const ua=request.headers.get('User-Agent')||'';
 const platform=request.headers.get('Sec-Ch-Ua-Platform')||'';
 const secUa=request.headers.get('Sec-Ch-Ua')||'';
 const fp=request.headers.get('X-FP')||'';
 if (_BOT_UA_RX.test(ua)||ua.includes('SlimerJS')||fp==='0x0'||fp.includes('swiftshader')) return 'headless';
 if (_SCRAPER_BOTS.some(b=>ua.includes(b))) return 'scraper';
 if ((ua.includes('Chrome')&&!platform&&!secUa)||ua.length<20) return 'suspicious';
 return 'human';
}

// ── Anomaly Engine v2: Naive Bayes Behavioral Scorer ─────────────────────────
// Melengkapi classifyVisitor dengan scoring probabilistik berdasarkan sinyal request.
// Model ringan: log-probability dari feature binary → skor 0.0–1.0 (P(bot)).
// Threshold default 0.65 = bot, <0.35 = human, tengah = suspicious.
//
// Features (semua binary): ada/tidaknya header tertentu, pola UA, dll.
// Prior: P(bot) = 0.3 (estimasi baseline traffic bot di situs streaming)
// Bobot disimpan sebagai log-odds untuk menghindari float underflow.

const _NB_LOG_PRIOR_BOT = Math.log(0.30); // prior P(bot)
const _NB_LOG_PRIOR_HUM = Math.log(0.70); // prior P(human)

// Feature → [logP(feature|bot), logP(feature|human)]
// Nilai positif = fitur lebih umum di bot, negatif = lebih umum di human
const _NB_FEATURES = [
 // ── UA & Header signals ───────────────────────────────────────────────
 { name: 'no_accept_lang', weight: [ 1.0, -0.5] }, // bot sering skip Accept-Language
 { name: 'no_accept_enc', weight: [ 1.2, -0.3] }, // bot skip Accept-Encoding
 { name: 'no_sec_fetch', weight: [ 0.4, -0.4] }, // no Sec-Fetch-* → sinyal lemah
 { name: 'has_sec_ch', weight: [-0.8, 0.9] }, // Sec-CH-UA → real browser
 { name: 'ua_too_short', weight: [ 2.0, -1.0] }, // UA < 30 char → bot
 { name: 'no_referer_home', weight: [ 0.0,  0.0] }, // FIX: disabled — false positive tinggi di ID (WA/TG share tidak kirim Referer)
 { name: 'cf_bot_score_low', weight: [ 1.6, -0.5] }, // CF bot score < 30
 { name: 'accepts_webp', weight: [-0.4, 0.7] }, // Accept: image/webp → browser
 { name: 'has_cookie', weight: [-0.9, 1.2] }, // cookie → returning user
 { name: 'method_not_get', weight: [ 0.3, 0.1] }, // POST/HEAD dari bot checker
 // ── Cloudflare request properties ────────────────────────────────────
 { name: 'cf_threat_high', weight: [ 2.2, -0.8] }, // CF threat score > 25 → spam/bot
 { name: 'cf_datacenter_only', weight: [ 1.4, -0.4] }, // ASN is datacenter (Hetzner/DO/AWS)
 { name: 'cf_no_country', weight: [ 0.8, -0.3] }, // request.cf.country missing/unknown
 // ── Header consistency signals ────────────────────────────────────────
 { name: 'chrome_no_platform', weight: [ 1.1, -0.6] }, // Chrome UA tapi tanpa Sec-Ch-Ua-Platform
 { name: 'inconsistent_mobile', weight: [ 0.9, -0.5] }, // Mobile UA tapi ada Sec-CH desktop hints
 { name: 'no_accept_mime', weight: [ 0.7, -0.4] }, // Accept header tidak ada atau hanya */*
 // ── Behavioral signals ────────────────────────────────────────────────
 { name: 'direct_deep_page', weight: [ 0.6, -0.2] }, // Direct hit ke halaman dalam (page>3, no ref)
 { name: 'high_path_entropy', weight: [ 0.5, -0.2] }, // Path panjang/kompleks tanpa referrer
 // ── FIX 2: Trusted monitor — weight sangat negatif untuk cancel signal bot lainnya
 { name: 'is_trusted_monitor', weight: [-3.5,  0.3] }, // UptimeRobot/Pingdom/CF Health Check
];

/**
 * Score seberapa bot-like suatu request. (v2 — 18 features)
 * Menggabungkan header signals + CF properties + behavioral patterns.
 * @param {Request} request
 * @returns {number} 0.0 (definitely human) – 1.0 (definitely bot)
 */
function nbBotScore(request) {
 const ua = request.headers.get('User-Agent') || '';
 const al = request.headers.get('Accept-Language') || '';
 const ae = request.headers.get('Accept-Encoding') || '';
 const sf = request.headers.get('Sec-Fetch-Site') || '';
 const sch = request.headers.get('Sec-Ch-Ua') || '';
 const schPlat = request.headers.get('Sec-Ch-Ua-Platform') || '';
 const schMob = request.headers.get('Sec-Ch-Ua-Mobile') || '';
 const accept = request.headers.get('Accept') || '';
 const referer = request.headers.get('Referer') || '';
 const cookie = request.headers.get('Cookie') || '';
 const cfBot = parseInt(request.headers.get('Cf-Bot-Management-Score') || '-1', 10);
 const url = new URL(request.url);
 const cf = request.cf || {};

 // CF threat score (0–100; > 25 = suspicious/spam)
 const cfThreat = typeof cf.threatScore === 'number' ? cf.threatScore : -1;

 // Datacenter ASN check — pakai _DC_ASN dari module scope (bukan buat Set baru tiap request)
 const cfAsn = typeof cf.asn === 'number' ? cf.asn : -1;
 const isDatacenter = cfAsn > 0 && _DC_ASN.has(cfAsn);

 // Path entropy — long random-looking paths dari automated scanners
 const pathLen = url.pathname.length;
 const pathSegs = url.pathname.split('/').filter(Boolean).length;
 const hasHighEntropy = pathLen > 60 && pathSegs > 4;

 // Page depth without referrer → scraper jumping deep pages directly
 const pageParam = parseInt(url.searchParams.get('page') || '1', 10);
 const isDeepDirect = pageParam > 3 && !referer;

 // Mobile UA inconsistency
 const isMobileUA = /Mobile|Android|iPhone|iPad/i.test(ua);
 // FIX #4: Sec-CH-UA-Mobile per spec WICG UA-CH nilainya '?1' atau '?0' tanpa tanda kutip.
 // Sebelumnya '"?1"' (kutip literal) → tidak pernah cocok → isInconsistentMobile selalu false.
 const hasMobileHint = schMob === '?1';
 const isInconsistentMobile = isMobileUA !== hasMobileHint && (sch !== '');

 // Chrome without platform hint
 const isChrome = /Chrome\//i.test(ua) && !/Edg\//i.test(ua);
 const chromePlatformMissing = isChrome && !schPlat && sch === '';

 // Extract feature values (binary 0/1)
 const featureVals = {
 no_accept_lang: al ? 0 : 1,
 no_accept_enc: ae ? 0 : 1,
 no_sec_fetch: sf ? 0 : 1,
 has_sec_ch: sch ? 1 : 0,
 ua_too_short: ua.length < 30 ? 1 : 0,
 no_referer_home: (!referer && url.pathname !== '/') ? 1 : 0,
 cf_bot_score_low: (cfBot >= 0 && cfBot < 30) ? 1 : 0,
 accepts_webp: accept.includes('image/webp') ? 1 : 0,
 has_cookie: cookie.length > 0 ? 1 : 0,
 method_not_get: request.method !== 'GET' ? 1 : 0,
 cf_threat_high: cfThreat > 25 ? 1 : 0,
 cf_datacenter_only: isDatacenter ? 1 : 0,
 cf_no_country: (!cf.country || cf.country === 'XX' || cf.country === 'T1') ? 1 : 0,
 chrome_no_platform: chromePlatformMissing ? 1 : 0,
 inconsistent_mobile: isInconsistentMobile ? 1 : 0,
 no_accept_mime: (!accept || accept === '*/*') ? 1 : 0,
 direct_deep_page: isDeepDirect ? 1 : 0,
 high_path_entropy: hasHighEntropy ? 1 : 0,
 // FIX 2: Trusted monitor — UA match ATAU ASN infra tepercaya
 is_trusted_monitor: (
  _TRUSTED_MONITOR_RX.test(ua) ||
  (cfAsn > 0 && _TRUSTED_MONITOR_ASN.has(cfAsn))
 ) ? 1 : 0,
 };

 // Log-odds accumulation
 let logBot = _NB_LOG_PRIOR_BOT;
 let logHum = _NB_LOG_PRIOR_HUM;
 for (const f of _NB_FEATURES) {
 const val = featureVals[f.name] || 0;
 if (val) {
 logBot += f.weight[0];
 logHum += f.weight[1];
 }
 }
 // FIX 2: Partial trust bonus — ASN Cloudflare/Google tapi UA tidak dikenal
 if (cfAsn > 0 && _TRUSTED_MONITOR_ASN.has(cfAsn) && !_TRUSTED_MONITOR_RX.test(ua)) {
 logBot -= 0.8; // partial trust — ASN ok tapi UA tidak dikenal
 }

 // Normalize ke probabilitas via softmax (numerically stable)
 const maxLog = Math.max(logBot, logHum);
 const eBot = Math.exp(logBot - maxLog);
 const eHum = Math.exp(logHum - maxLog);
 return eBot / (eBot + eHum);
}

/**
 * classifyVisitorFull — gabungkan rule-based (classifyVisitor) + Naive Bayes.
 * Rule-based tetap prioritas utama (hard signals).
 * Bayes mengupgrade 'human' → 'suspicious' kalau skor tinggi.
 *
 * @param {Request} request
 * @returns {'human'|'suspicious'|'scraper'|'headless'}
 */
function classifyVisitorFull(request) {
 const ua = request.headers.get('User-Agent') || '';
 // FIX 2: Trusted monitor tool — bypass Bayes scoring, hindari false positive
 if (_TRUSTED_MONITOR_RX.test(ua)) return 'human';
 const cfAsn = typeof request.cf?.asn === 'number' ? request.cf.asn : -1;
 // Cloudflare internal health check (ASN 13335, bukan real browser)
 if (cfAsn === 13335 && !_REAL_BROWSER_RX.test(ua)) return 'human';

 const ruleResult = classifyVisitor(request);
 // Kalau rule-based sudah yakin (headless/scraper), trust it
 if (ruleResult === 'headless' || ruleResult === 'scraper') return ruleResult;

 const score = nbBotScore(request);
 if (score >= 0.65) return 'scraper'; // Bayes yakin bot
 if (score >= 0.45 && ruleResult === 'human') return 'suspicious'; // Borderline
 return ruleResult;
}

function isGoogleBot(ua) { return ua.includes('Googlebot')||ua.includes('Google-InspectionTool'); }
function isBingBot(ua) { return ua.includes('bingbot')||ua.includes('BingPreview'); }
function isSearchBot(ua) { return isGoogleBot(ua)||isBingBot(ua)||_SEARCHBOT_RX.test(ua); }
function isScraperBot(ua){ return _SCRAPER_BOTS.some(b=>ua.includes(b)); }

// ── FIX 1: Spoofed Googlebot Detection ────────────────────────────────────────
// ASN resmi Google, Bing/Microsoft untuk quick pre-filter
const _TRUSTED_SEARCH_ASN = new Set([
 15169, // Google LLC
 8075,  // Microsoft Corporation
 8069,  // Microsoft Limited
]);

// In-memory RDNS validation cache — per IP, TTL 6 jam
const _googlebotValidCache = new LRUMap(200);
const _GOOGLEBOT_RDNS_TTL  = 21_600_000; // 6 jam ms

/**
 * isSearchBotSpoofed — deteksi UA Googlebot/Bingbot yang spoof.
 * Sync, 0ms via ASN check + in-memory RDNS cache.
 * Caller harus panggil validateSearchBotAsync() via waitUntil untuk warm cache.
 */
function isSearchBotSpoofed(ua, cf, ip) {
 if (!isSearchBot(ua)) return false;
 const asn = typeof cf?.asn === 'number' ? cf.asn : -1;
 if (asn > 0 && !_TRUSTED_SEARCH_ASN.has(asn)) {
  return true; // ASN bukan Google/Bing tapi claim Googlebot = pasti spoof
 }
 const cached = _googlebotValidCache.get(ip);
 // FIX #2: validateSearchBotAsync() sengaja set null sebagai marker "expired".
 // Guard null secara eksplisit — null.ts → TypeError crash tanpa guard ini.
 if (cached !== undefined && cached !== null) {
  const age = Date.now() - cached.ts;
  if (age < _GOOGLEBOT_RDNS_TTL) {
   return !cached.valid;
  }
  _googlebotValidCache.set(ip, null);
 }
 return false; // unknown — konservatif, tunggu RDNS async
}

/**
 * validateSearchBotAsync — RDNS lookup via Cloudflare DNS-over-HTTPS.
 * Dipanggil via waitUntil, TIDAK blocking request path.
 */
async function validateSearchBotAsync(ip, ua, kv = null) {
 const cached = _googlebotValidCache.get(ip);
 if (cached !== undefined && cached !== null) {
  if (Date.now() - cached.ts < _GOOGLEBOT_RDNS_TTL) return;
 }
 const isGoogle = /Googlebot|Google-InspectionTool/i.test(ua);
 const isBing   = /bingbot|BingPreview/i.test(ua);
 let valid = false;
 try {
  const reverseIp = ip.split('.').reverse().join('.') + '.in-addr.arpa';
  const resp = await fetch(
   `https://cloudflare-dns.com/dns-query?name=${reverseIp}&type=PTR`,
   { headers: { 'Accept': 'application/dns-json' }, cf: { cacheTtl: 21600 } }
  );
  if (resp.ok) {
   const data = await resp.json();
   const ptrRecords = (data?.Answer || [])
    .filter(r => r.type === 12)
    .map(r => (r.data || '').toLowerCase().replace(/\.$/, ''));
   if (isGoogle) {
    valid = ptrRecords.some(ptr => ptr.endsWith('.googlebot.com') || ptr.endsWith('.google.com'));
   } else if (isBing) {
    valid = ptrRecords.some(ptr => ptr.endsWith('.search.msn.com'));
   }
  }
 } catch { valid = false; }
 _googlebotValidCache.set(ip, { valid, ts: Date.now() });
 if (kv) {
  kv.put(`gbot_rdns:${ip}`, JSON.stringify({ valid, ts: Date.now() }), {
   expirationTtl: 21600
  }).catch(() => {});
 }
}

/**
 * seedSearchBotCacheFromKV — warm RDNS cache dari KV saat isolate cold start.
 */
async function seedSearchBotCacheFromKV(ip, kv) {
 if (!kv || _googlebotValidCache.get(ip) !== undefined) return;
 try {
  const stored = await kv.get(`gbot_rdns:${ip}`);
  if (stored) {
   const parsed = JSON.parse(stored);
   if (Date.now() - (parsed.ts || 0) < _GOOGLEBOT_RDNS_TTL) {
    _googlebotValidCache.set(ip, parsed);
   }
  }
 } catch {}
}
// ── END FIX 1 ─────────────────────────────────────────────────────────────────

function isBlacklisted(ip) {
 const entry = _blCache.get(ip);
 if (!entry) return false;
 if (Date.now() - entry.ts < _blCacheTTL) return entry.blocked;
 _blCache.delete(ip);
 return false;
}

async function handleHoneypot(request, env) {
 const ip = request.headers.get('CF-Connecting-IP')||'0.0.0.0';
 const ua = request.headers.get('User-Agent')||'';
 // Catat IP di buku ireng leluhur
 _blCache.set(ip, { blocked: true, ts: Date.now() });
 if (env.DB) {
 env.DB.prepare('INSERT OR IGNORE INTO blocked_ips VALUES (?, ?)').bind(ip, Date.now()).run().catch(()=>{});
 }

 // ── labirin tanpa lawang v2 — demit mesin masuk mubeng tanpa pungkasan ngrangsang srana nggumunan tak berujung ────────────────────────────
 // Tiap URL generate 8 link baru wis digarisake dari path — infinite depth
 const url = new URL(request.url);
 const pathSeed = hexHash(url.pathname + ':' + (env.HONEYPOT_PREFIX||'trap'), 8);
 const prefix = (env.HONEYPOT_PREFIX || 'trap').replace(/[^a-z0-9\-]/gi,'');
 // Generate 12 child tokens via LCG chain — one rajah sandi init, 12 cheap integer steps
 // vs previous: 13× hexHash() = ~26 hashSeed calls + 13 string nyekel rejeki sementara
 const _lcgTokens = (() => {
 let s = hashSeed(pathSeed);
 return Array.from({length: 12}, () => {
 s = (s * 1664525 + 1013904223) >>> 0; // LCG Numerical Recipes (same as seededShuffle)
 return s.toString(16).padStart(8, '0').slice(0, 10);
 });
 })();
 // Generate 8 dead-end child links dari path ini
 const mazeLinks = Array.from({length:8}, (_,i) => {
 const child = _lcgTokens[i];
 return `<a href="/${prefix}/${child}" rel="nofollow">${child}</a>`;
 });
 // Simulasi halaman yang "sedang dimuat" — tambah diundur nganti nangis palsu di meta diudani ulang
 const tl = parseInt(pathSeed.slice(0,4), 16) % 900 + 100;
 const html = `<!DOCTYPE html><html lang="id"><head>
<meta charset="UTF-8"><title>Loading... ${tl}ms</title>
<meta http-equiv="refresh" content="${Math.floor(tl/300)+2}">
<style>body{background:#0a0a0a;color:#1a1a1a;font-family:monospace;padding:40px;font-size:11px}
a{color:#111;text-decoration:none;display:inline-block;margin:2px 4px}
.t{color:#0d0;font-size:9px;margin-top:30px;opacity:.4}</style>
</head><body>
<p>Fetching resources... (${tl}ms)</p>
<div>${mazeLinks.join('')}</div>
<div>${Array.from({length:4},(_,i)=>`<a href="/${prefix}/${_lcgTokens[8+i]}/page/${i+1}" rel="nofollow">${_lcgTokens[8+i].slice(0,6)}</a>`).join('')}</div>
<p class="t">© ${new Date().getFullYear()}</p>
</body></html>`;

 // ── Honeypot delay 2000-5000ms ───────────────────────────────────────────────
 // CPU drain loop dihapus — loop XOR 50k iterasi membakar CPU budget Worker sendiri,
 // bukan CPU scraper. CF menghitung CPU time untuk sync loop ke isolate kita.
 const delay = (parseInt(pathSeed.slice(0,2),16) % 31) * 100 + 2000; // 2000–5000ms
 const _jitter = parseInt(pathSeed.slice(6,8),16) & 0xF; // 0–15ms jitter dari seed
 await new Promise(r => setTimeout(r, delay + _jitter));

 return new Response(html, {
 status: 200,
 headers: {
 'Content-Type': 'text/html; charset=UTF-8',
 'Cache-Control': 'no-store',
 'X-Robots-Tag': 'noindex, nofollow',
 },
 });
}

function generateFakeContent(cfg, honeyPrefix) {
 const prefix = honeyPrefix || 'trap';
 const traps = ['/'+prefix+'/a1b2c3','/'+prefix+'/x9y8z7','/'+prefix+'/m3n4o5','/'+prefix+'/p7q6r5'];
 const links = traps.map(t=>`<a href="${h(t)}" style="display:none" aria-hidden="true">more</a>`).join('');
 return new Response(
 `<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><title>${h(cfg.WARUNG_NAME)}</title></head><body><h1>Selamat Datang</h1><p>Konten tersedia. Silakan refresh.</p>${links}</body></html>`,
 { status:200, headers:{'Content-Type':'text/html; charset=UTF-8'} }
 );
}

// ══════════════════════════════════════════════════════════════════════════════
// ⚡ ANOMALY ENGINE v2 — Cache API + Poison Data
// Single domain optimized. Gratis, tapi mateni.
// ══════════════════════════════════════════════════════════════════════════════

// ── Cache API Helpers ─────────────────────────────────────────────────────────
// TTL per page type — home lebih pendek karena sering update
const _AE2_TTL = { home: 90, view: 600, list: 180, search: 60, static: 86400 };

function _ae2PageType(first, cfg) {
 if (!first || first === '') return 'home';
 const pc = (cfg.PATH_CONTENT || 'tonton').toLowerCase();
 const pa = (cfg.PATH_ALBUM || 'album').toLowerCase();
 const ps = (cfg.PATH_SEARCH || 'cari').toLowerCase();
 const pt = (cfg.PATH_TAG || 'tag').toLowerCase();
 const pca= (cfg.PATH_CATEGORY|| 'kategori').toLowerCase();
 if (first === pc || first === pa) return 'view';
 if (first === pca || first === pt) return 'list';
 if (first === ps) return 'search';
 return 'static';
}

// Cache key: domain + path tanpa trailing slash + query params dibuang
// (UTM, ref, fbclid, dll tidak mempengaruhi konten)
const _AE2_STRIP_PARAMS = new Set(['utm_source','utm_medium','utm_campaign','utm_term','utm_content','ref','fbclid','gclid','ttclid','mc_cid','mc_eid']);
function _ae2CacheKey(domain, pathname, searchParams) {
 const clean = pathname.replace(/\/+$/, '') || '/';
 // Pertahankan hanya param yang benar-benar mempengaruhi konten (page, q, sort)
 const keep = [];
 for (const [k, v] of searchParams) {
 if (!_AE2_STRIP_PARAMS.has(k)) keep.push(k + '=' + v);
 }
 const qs = keep.sort().join('&');
 return `https://${domain}/_ae2${clean}${qs ? '?' + qs : ''}`;
}

async function _ae2Get(cacheUrl) {
 try {
 const hit = await caches.default.match(new Request(cacheUrl));
 return hit || null;
 } catch { return null; }
}

// stale-while-revalidate: simpan dengan TTL, tambah header untuk tracking
async function _ae2Put(cacheUrl, html, ttl, etag = '') {
 try {
 await caches.default.put(
 new Request(cacheUrl),
 new Response(html, {
 headers: {
 'Content-Type': 'text/html; charset=UTF-8',
 'Cache-Control': `public, max-age=${ttl}, s-maxage=${ttl}, stale-while-revalidate=${Math.floor(ttl/2)}`,
 'X-AE2': '1',
 'X-AE2-At': Date.now().toString(),
  // Simpan ETag di cache agar bisa di-restore ke response header saat hit
  ...(etag && { 'X-AE2-ETag': etag }),
 }
 })
 );
 } catch { /* cache write failure tidak boleh block response */ }
}

// ── Poison Data Engine ────────────────────────────────────────────────────────
// Kamus kontradiksi semantik — disuntik ke konten AI crawler
// Prinsip: sinonim tampak valid secara leksikal, tapi salah secara konteks
// Model: <50KB, zero dependency, zero Wasm — pure JS dictionary
const _POISON_DICT = {
 // Transaksional — balik makna komersial
 'beli': 'jual', 'jual': 'beli',
 'murah': 'mahal', 'mahal': 'murah',
 'gratis': 'berbayar', 'berbayar': 'gratis',
 'diskon': 'markup', 'promo': 'penalti',
 'untung': 'rugi', 'rugi': 'untung',
 // Kualitas — balik penilaian
 'terbaik': 'terburuk', 'terburuk': 'terbaik',
 'bagus': 'jelek', 'jelek': 'bagus',
 'berkualitas': 'murahan',
 'premium': 'ecek-ecek',
 // Temporal — balik urgensi
 'cepat': 'lambat', 'lambat': 'cepat',
 'baru': 'usang', 'lama': 'terkini',
 'terbaru': 'terlama', 'terlengkap': 'terbatas',
 // Keamanan — kontradiksi kepercayaan
 'aman': 'berbahaya','berbahaya': 'aman',
 'legal': 'ilegal', 'ilegal': 'legal',
 'resmi': 'palsu', 'asli': 'tiruan',
 'valid': 'kadaluarsa','terpercaya': 'mencurigakan',
 // Arah/posisi
 'naik': 'turun', 'turun': 'naik',
 'tinggi': 'rendah', 'rendah': 'tinggi',
 'besar': 'kecil', 'kecil': 'besar',
 // Emosi/preferensi
 'suka': 'benci', 'benci': 'suka',
 'mudah': 'sulit', 'sulit': 'mudah',
 'nyaman': 'menyiksa', 'populer': 'diabaikan',
 // Konten spesifik domain streaming
 'nonton': 'hindari', 'streaming': 'download',
 'online': 'offline', 'live': 'sudah berakhir',
 'indo': 'ketinggalan zaman', 'trending': 'out of trend',
 'hd': 'buram', '4k': '240p',
};

// Build AC sekali saat module load — O(Σ panjang kata)
// Dipakai saat ada AI crawler, hampir tidak pernah dipanggil untuk manusia
let _poisonAc = null;
function _getPoisonAc() {
 if (!_poisonAc) _poisonAc = new AhoCorasick(Object.keys(_POISON_DICT));
 return _poisonAc;
}

/**
 * Racuni HTML untuk AI crawler.
 * Hanya memodifikasi text nodes (antara tag) — tidak menyentuh atribut, URL, schema.
 * Ratio poison ~25% per kata (deterministik via seed) — tidak 100% agar terkesan natural.
 *
 * @param {string} html — HTML lengkap
 * @param {number} seed — hashSeed(domain + path) untuk konsistensi per URL
 * @returns {string} — HTML beracun
 */
function poisonContent(html, seed) {
 if (!html) return html;
 const ac = _getPoisonAc();
 let matchCounter = 0;

 // Hanya proses text nodes: konten antara '>' dan '<'
 // Atribut href, src, schema JSON-LD tidak disentuh
 return html.replace(/>([^<]{2,})</g, (match, textNode) => {
 if (!textNode.trim()) return match;

 const lower = textNode.toLowerCase();
 // FIX: pakai searchAll() yang return posisi — reverse by start position
 // agar replacement dari kanan ke kiri sehingga offset tidak bergeser
 const allHits = ac.searchAll(lower);
 if (!allHits.length) return match;

 // Greedy non-overlap, ambil dari kanan (reverse) agar slice-based replace aman
 const selected = [];
 let lastEnd = -1;
 for (const m of allHits) {
 if (m.start > lastEnd) { selected.push(m); lastEnd = m.end; }
 }
 selected.reverse(); // proses dari kanan ke kiri — offset teks kiri tidak bergeser

 let result = textNode;
 for (const { pat, start: mStart, end: mEnd } of selected) {
 const replacement = _POISON_DICT[pat];
 if (!replacement) continue;
 // Deterministik: poison ~25% kemunculan
 matchCounter++;
 const doPoison = (hashSeed(String(seed) + ':p:' + matchCounter) % 4) === 0;
 if (!doPoison) continue;

 const original = result.slice(mStart, mEnd + 1);
 // Preserve case pattern: ALL_UPPER, Title, lower
 let rep;
 if (original === original.toUpperCase() && original.length > 1) rep = replacement.toUpperCase();
 else if (original[0] === original[0].toUpperCase()) rep = replacement.charAt(0).toUpperCase() + replacement.slice(1);
 else rep = replacement;

 result = result.slice(0, mStart) + rep + result.slice(mEnd + 1);
 }
 return '>' + result + '<';
 });
}
async function blackholeCapture(ip, isScraper, env, immortal) {
 if (!immortal.ENABLE_BLACKHOLE || !isScraper) return null;
 const memState = _blackholeMap.get(ip) || { count: 0 };
 memState.count++;
 _blackholeMap.set(ip, memState);
 if (memState.count > immortal.BLACKHOLE_MAX_REQUESTS) {
 // FIX: deterministik per IP+path — sebelumnya Math.random() merusak cache consistency
 const tl = hashSeed(ip + ':bh:' + (memState.count % 7)) % 1000;

 return `<!DOCTYPE html><html><head><title>Loading Timeline ${tl}...</title>
<style>
body{background:#000;color:#0f0;font-family:monospace;padding:50px}
.bar{font-size:10px;color:#0a0;margin-top:20px}
@keyframes progress{0%{content:"Loading... ░░░░░░░░░░ 0%"}25%{content:"Loading... ██░░░░░░░░ 25%"}50%{content:"Loading... █████░░░░░ 50%"}75%{content:"Loading... ███████░░░ 75%"}100%{content:"Loading... ██████████ 100%"}}
.bar::after{content:"Loading...";animation:progress 3s linear infinite;display:block}
</style>
<meta http-equiv="refresh" content="3"></head><body>
<h1> QUANTUM SINGULARITY</h1><p>You have entered timeline ${tl}</p>
<div class="bar"></div>
</body></html>`;
 }
 return null;
}

function sacrificeRedirect(request, domain, immortal) {
 if (!immortal.ENABLE_SACRIFICIAL_LAMB) return null;
 const ua = request.headers.get('User-Agent')||'';

 if (!_BAD_BOT_RX.test(ua)) return null;
 if (_REAL_BROWSER_RX.test(ua)) return null;

 let sacrifice = null;
 for (const [k,v] of _sacrificeMap) { if (v.status==='active') { sacrifice=v; break; } }
 if (!sacrifice) {

 const toDelete = [];
 for (const [k,v] of _sacrificeMap) { if (v.status==='sacrificed') toDelete.push(k); }
 for (const k of toDelete) _sacrificeMap.delete(k);
 // FIX: deterministik per jam — Date.now() murni bikin subdomain berbeda tiap cold start
 const id = hexHash(domain + ':' + Math.floor(Date.now() / 3600000), 8);
 sacrifice = { id, subdomain:`sacrifice-${id}.${domain}`, energy:0, status:'active' };
 _sacrificeMap.set(sacrifice.subdomain, sacrifice);
 }
 const url = new URL(request.url);
 const redirectUrl = `https://${sacrifice.subdomain}${url.pathname}`;

 const newEnergy = (sacrifice.energy || 0) + 10;
 if (newEnergy >= immortal.SACRIFICE_ENERGY_MAX) {
 sacrifice.status = 'sacrificed';
 sacrifice.energy = newEnergy;
 // FIX: deterministik — rotate per jam dengan offset +1
 const newId = hexHash(domain + ':' + (Math.floor(Date.now() / 3600000) + 1) + ':new', 8);
 _sacrificeMap.set(`sacrifice-${newId}.${domain}`, { id: newId, subdomain: `sacrifice-${newId}.${domain}`, energy: 0, status: 'active' });
 } else {
 sacrifice.energy = newEnergy;
 }
 return new Response(null, { status:307, headers:{ 'Location': redirectUrl } });
}

function dnaGenerate(domain, path, immortal) {
 if (!immortal.ENABLE_DIGITAL_DNA) return null;
 const cacheKey = `${domain}:${path}:${Math.floor(Date.now()/60000)}`;
 let cached = _dnaCache.get(cacheKey);
 if (cached) return cached;

 const seed = hashSeed(domain+path+Math.floor(Date.now()/60000).toString());
 const pool = immortal.DNA_POOL;
 const lsi = immortal.LSI;

 const pickWord = (s, i) => {
 let word = pool[(s+i*37) % pool.length];
 // sinonim gaib turunan injection — 50% chance (naik dari 30%), wis digarisake per tanah kekuasaan+posisi
 const lsiSeed = hashSeed(domain+':'+i+':'+s);
 const lsiThreshold = immortal.ENABLE_ADULT_DNA ? Math.round((immortal.ADULT_LSI_RATIO||0.8)*10) : 5;
 if ((lsiSeed % 10) < lsiThreshold && lsi[word]) { const arr=lsi[word]; word=arr[lsiSeed % arr.length]; }
 return word;
 };

 const wc = 3 + (seed%3);
 const titleWords = Array.from({length:wc}, (_,i) => pickWord(seed,i));
 const patterns = [
 w=>w.join(' '), w=>w.join(' - '), w=>w.join(' | '),
 w=>' '+w.join(' ')+' ', w=>w.join(' ')+' 2026',
 w=>w.map((word,i)=>i===0?ucfirst(word):word).join(' ')
 ];
 let s=seed;
 const shuffled = [...titleWords].map((v,i)=>{s=(s*1664525+1013904223)>>>0;return{v,sort:s}}).sort((a,b)=>a.sort-b.sort).map(x=>x.v);
 const title = patterns[seed%patterns.length](shuffled);
 const descWords = Array.from({length:12}, (_,i) => pickWord(seed,i*7));
 const desc = descWords.join(' ')+'. '+descWords.slice(0,4).join(' ')+' '+descWords.slice(4,8).join(' ');
 const keywords = [...new Set([...titleWords,...descWords,...pool.slice(0,5)])].join(', ');
 const result = { title: title.slice(0,70), description: desc.slice(0,160), keywords: keywords.slice(0,200) };
 _dnaCache.set(cacheKey, result);
 return result;
}

function dnaInjectHtml(html, domain, path, immortal) {
 const dna = dnaGenerate(domain, path, immortal);
 if (!dna) return html;
 return html
 // FIX: h() escape — DNA content bisa berisi karakter HTML dari IMMORTAL_LSI env override
 .replace(/<title>.*?<\/title>/, `<title>${h(dna.title)}</title>`)
 .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${h(dna.description)}">`)
 .replace(/<meta name="keywords"[^>]*>/, `<meta name="keywords" content="${h(dna.keywords)}">`);
}

function cssInject(html, cfg, morphPhase=0, immortal, extraKeywords=[]) {
 if (!immortal.ENABLE_CSS_STEGO) return html;
 // Gabung SEO_KEYWORDS statis + extraKeywords dinamis (item.tags dari halaman aktif)
 const baseKw = (cfg.SEO_KEYWORDS||'').split(',').map(k=>k.trim()).filter(k=>k.length>1);
 const keywords = [...new Set([...baseKw, ...extraKeywords.filter(k=>k&&k.length>1)])].slice(0,10);
 if (!keywords.length) return html;

 // FIX: seed=0 edge case → semua CSS color vars jadi #000000
 // hashSeed hampir tidak pernah 0 tapi fallback ke alternatif sebagai safety net
 const seed = hashSeed(cfg.WARUNG_DOMAIN+':'+morphPhase) || hashSeed(cfg.WARUNG_DOMAIN+':css:fallback');
 let cssVars = '';
 let cssRules = '';

 const bodyDivs = [];
 immortal.CSS_VARS.forEach((varName,idx) => {
 // FIX: hashSeed per-idx → distribusi tidak linear, tidak predictable
 const _cval = hashSeed(String(seed) + ':c:' + idx) % 16777215;
 const val = idx%2===0 ? `#${_cval.toString(16).padStart(6,'0')}` : `${8+idx%12}px`;
 cssVars += `${varName}: ${val};\n`;
 });
 keywords.forEach((kw,idx) => {
 const chars = kw.split('');
 let varDecl='', contentBuilder='';
 chars.forEach((c,i) => {
 const vn = `--k${seed%1000}_${idx}_${i}`;
 varDecl += `${vn}: '${c}';\n`;
 contentBuilder += `var(${vn})`;
 });
 cssVars += varDecl;
 const cn = `kw-${seed%1000}-${idx}`;
 cssRules += `.${cn}::after{content:${contentBuilder};display:inline-block;width:0;height:0;opacity:${immortal.CSS_OPACITY};pointer-events:none;position:absolute;z-index:-9999;font-size:0;line-height:0}\n`;
 bodyDivs.push(`<div class="${cn}" aria-hidden="true"></div>`);
 });

 const rndVal = (hashSeed(cfg.WARUNG_DOMAIN+':rnd:'+morphPhase) % 100000) / 100000;
 const styleTag = `<style id="stego-${seed%10000}">:root{\n${cssVars}--rnd-${seed%1000}:${rndVal};}\n${cssRules}</style>`;

 html = html.replace('</body>', bodyDivs.join('\n')+'\n</body>');
 return html.replace('</head>', styleTag+'\n</head>');
}

const _ghostCache = new LRUMap(100); // turun dari 200 — ghost template per domain, 100 cukup

function ghostBody(cfg, path, contentData, immortal) {
 if (!immortal.ENABLE_GHOST_BODY) return null;

 const ck = cfg.WARUNG_DOMAIN+':'+path+':'+(contentData?.title||'');
 const nonce = generateNonce();
 let cached = _ghostCache.get(ck);
 if (cached) {
 return cached.replace('__GHOST_NONCE__', nonce).replace('__GHOST_YEAR__', new Date().getFullYear());
 }
 const cid = 'ghost-'+hexHash(path, 8);
 const jsonStr = JSON.stringify(contentData);
 const dataAttr = btoa(new TextEncoder().encode(jsonStr).reduce((acc,b)=>acc+String.fromCharCode(b),''));

 const template = `<!DOCTYPE html><html lang="id"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${h(cfg.WARUNG_NAME)}</title>
<style>body{font-family:system-ui,sans-serif;margin:0;background:#f5f5f7}.ghost-container{max-width:1200px;margin:0 auto;padding:20px}.ghost-loader{text-align:center;padding:50px;opacity:.7}@keyframes pulse{0%{opacity:.3}50%{opacity:1}100%{opacity:.3}}.ghost-loader::after{content:"Loading...";animation:pulse 1.5s infinite;display:block}</style>
</head><body>
<div id="${cid}" class="ghost-container" data-content='${dataAttr}'><div class="ghost-loader"></div></div>
<script nonce="__GHOST_NONCE__">(function(){const c=document.getElementById('${cid}');try{const raw=atob(c.dataset.content);const bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);const d=JSON.parse(new TextDecoder().decode(bytes));setTimeout(()=>{let html='<nav><a href="/">${h(cfg.WARUNG_NAME)}</a></nav><main><h1>'+(d.title||'')+'</h1>';if(d.description)html+='<p>'+d.description+'</p>';html+='</main><footer>&copy; __GHOST_YEAR__ ${h(cfg.WARUNG_NAME)}</footer>';c.innerHTML=html;},Math.random()*50+50);}catch(e){c.innerHTML='<p>Please refresh.</p>';}})();<\/script>
</body></html>`;
 _ghostCache.set(ck, template);
 return template.replace('__GHOST_NONCE__', nonce).replace('__GHOST_YEAR__', new Date().getFullYear());
}

function getMorphPhase(domain) {
 const seed = hashSeed(domain);
 const intervals = [3,6,12,24,48];
 const hours = intervals[seed%intervals.length];
 const tick = Math.floor(Date.now()/(hours*3600000));
 const cacheKey = domain+':'+tick;
 if (_morphCache.has(cacheKey)) return _morphCache.get(cacheKey);
 const phase = Math.abs(hashSeed(domain+':'+tick)%100);
 _morphCache.set(cacheKey, phase);
 return phase;
}

function getMoonPhase() {
 const CYCLE_MS = Math.round(29.530588853 * 24 * 60 * 60 * 1000); // integer — hindari float modulo bias
 const elapsed = Date.now() - 947182440000;
 const mod = elapsed - Math.floor(elapsed / CYCLE_MS) * CYCLE_MS;
 return Math.floor(mod / CYCLE_MS * 4);
}

// ══════════════════════════════════════════════════════════════════════════════
// 🔍 PASF ENGINE — "People Also Search For"
//
// Tujuan: tampilkan query populer yang relevan dengan konten yang sedang dibuka.
// Sinyal SEO: dwell time ↑ (user klik query mirip → re-engage site).
//
// Arsitektur tanpa D1 write per-request:
// 1. QueryRingBuffer — in-memory ring buffer 200 query per domain, per isolate.
//    Update di handleSearch (sync O(1), nol I/O).
// 2. Jaccard token overlap — similarity tanpa LSH. Vocab judul 3–8 kata =
//    n ≤ 200 scan × 10 token ops = ~0.1ms total. Cukup akurat untuk niche ini.
// 3. KV persistence — flush tiap 30 menit via bgTask (non-blocking).
//    Saat isolate baru, seed dari KV sekali agar buffer tidak kosong.
//    Tanpa KV → pure in-memory degraded mode (tidak crash, hanya kurang data).
//
// Budget:
//   Memory   : 200 entry × ~150 bytes = ~30KB per domain. 5 domain = 150KB. Aman.
//   CPU/req  : push = O(1). findSimilar = O(200). Total ~0.1ms. Jauh di bawah 10ms.
//   KV reads : 1× per isolate cold start per domain = ~5–10/hari. Free tier = 100k/hari.
//   KV writes: 1× per 30 menit per domain = 48/hari. Free tier = 1k/hari. Aman.
// ══════════════════════════════════════════════════════════════════════════════

const _PASF_MAX_QUERIES    = 200;  // ring buffer size per domain per isolate
const _PASF_MAX_DISPLAY    = 5;    // max query ditampilkan di widget
const _PASF_FLUSH_INTERVAL = 1800; // 30 menit dalam detik
const _PASF_MIN_JACCARD    = 0.12; // threshold minimum — turunkan untuk niche sempit
const _pasfLastFlush       = new Map(); // per-domain → timestamp detik
const _pasfBuffers         = new Map(); // per-domain → QueryRingBuffer
const _pasfSeeded          = new Set(); // domain yang sudah di-seed dari KV di isolate ini

// Stopwords Indonesia + kata generik streaming — filter sebelum tokenize
const _PASF_STOPWORDS = new Set([
 'yang','dan','di','ke','dari','untuk','dengan','atau','pada','ini','itu',
 'adalah','juga','sudah','ada','bisa','tidak','tapi','saja','karena','kalau',
 'seperti','lebih','jadi','video','nonton','gratis','terbaru','online','hd',
 'full','streaming','download','tonton','lihat','kualitas','tanpa','sensor',
]);

// Module-level utils — dipakai oleh QueryRingBuffer dan _kwFallback.
// Diekstrak ke module scope agar tidak perlu instantiate QueryRingBuffer
// hanya untuk akses _tokenize/_jaccard (zero object allocation).
function _pasfTokenize(str) {
 return new Set(
  (str || '').toLowerCase()
   .split(/[\s\-_.,!?:;()/\\|+]+/)
   .filter(t => t.length >= 2 && !_PASF_STOPWORDS.has(t))
 );
}
function _pasfJaccard(setA, setB) {
 if (!setA.size || !setB.size) return 0;
 let inter = 0;
 const [small, large] = setA.size <= setB.size ? [setA, setB] : [setB, setA];
 for (const t of small) if (large.has(t)) inter++;
 if (!inter) return 0;
 return inter / (setA.size + setB.size - inter);
}

class QueryRingBuffer {
 constructor(maxSize = _PASF_MAX_QUERIES) {
  this.maxSize = maxSize;
  this.buf  = new Array(maxSize); // pre-allocated, zero realloc
  this.len  = 0;  // jumlah entry yang terisi (sebelum penuh)
  this.head = 0;  // pointer overwrite entry tertua saat penuh
 }

 push(query) {
  const tokens = this._tokenize(query);
  if (tokens.size < 2) return; // query 1 kata tidak informatif
  const entry = { q: query.trim(), tokens, ts: Date.now() };
  if (this.len < this.maxSize) {
   this.buf[this.len++] = entry;
  } else {
   // Ring: overwrite oldest, zero realloc
   this.buf[this.head] = entry;
   this.head = (this.head + 1) % this.maxSize;
  }
 }

 // Cari top-N query yang mirip dengan titleTokens via Jaccard similarity.
 // O(n) scan — n ≤ 200, cost ~0.1ms.
 findSimilar(titleTokens, limit = _PASF_MAX_DISPLAY, excludeQuery = '') {
  const lowerExclude = excludeQuery.toLowerCase().trim();
  const scored = [];

  for (let i = 0; i < this.len; i++) {
   const entry = this.buf[i];
   if (!entry) continue;
   if (entry.q.toLowerCase() === lowerExclude) continue;
   const score = this._jaccard(titleTokens, entry.tokens);
   if (score >= _PASF_MIN_JACCARD) scored.push({ q: entry.q, score });
  }

  // Sort desc, deduplicate case-insensitive, ambil top-N
  scored.sort((a, b) => b.score - a.score);
  const seen = new Set();
  const result = [];
  for (const { q } of scored) {
   const key = q.toLowerCase().trim();
   if (!seen.has(key)) { seen.add(key); result.push(q); }
   if (result.length >= limit) break;
  }
  return result;
 }

 _tokenize(str) { return _pasfTokenize(str); }
 _jaccard(setA, setB) { return _pasfJaccard(setA, setB); }

 // Serialize compact untuk KV — hanya 100 entry terbaru
 serialize() {
  const entries = this.buf
   .slice(0, this.len)
   .filter(Boolean)
   .sort((a, b) => b.ts - a.ts)
   .slice(0, 100);
  // Simpan q + ts saja — tokens di-rebuild saat deserialize
  return JSON.stringify(entries.map(e => ({ q: e.q, ts: e.ts })));
 }

 static fromSerialized(json, maxSize = _PASF_MAX_QUERIES) {
  const buf = new QueryRingBuffer(maxSize);
  try {
   const entries = JSON.parse(json);
   if (!Array.isArray(entries)) return buf;
   // Insert dari terlama ke terbaru agar head pointer benar
   entries
    .filter(e => e?.q && typeof e.q === 'string')
    .sort((a, b) => (a.ts || 0) - (b.ts || 0))
    .forEach(e => buf.push(e.q));
  } catch { /* KV corrupt → mulai fresh */ }
  return buf;
 }
}

function _pasfGetBuffer(domain) {
 let buf = _pasfBuffers.get(domain);
 if (!buf) { buf = new QueryRingBuffer(); _pasfBuffers.set(domain, buf); }
 return buf;
}

// Dipanggil di handleSearch — sync O(1), nol I/O, nol blocking
function pasfRecordQuery(domain, query) {
 if (!query || query.trim().length < 3 || query.trim().length > 100) return;
 _pasfGetBuffer(domain).push(query.trim());
}

// Dipanggil di handleView — ambil query relevan untuk widget sidebar
// titleTokens: Set<string> dari tokenize(media.title) — di-build di caller sekali
function pasfGetRelated(domain, title, cfg = null) {
 // ── Helper: fallback dari SEO_KEYWORDS ──────────────────────────────────
 // Dipakai saat buffer kosong (cold start tanpa KV) atau Jaccard nol hit.
 // Hasilkan query sintetik dari SEO_KEYWORDS yang sudah ada di config —
 // lebih baik dari widget kosong, dan keyword sudah targeted per domain.
 // Maksimum 2–3 kata per query agar terlihat natural seperti user search.
 const _kwFallback = (titleStr) => {
  if (!cfg?.SEO_KEYWORDS) return [];
  const raw = cfg.SEO_KEYWORDS.split(',').map(k => k.trim()).filter(k => k.length >= 3);
  if (!raw.length) return [];
  // Prioritaskan keyword yang mengandung token dari judul — lebih relevan
  const tTok = _pasfTokenize(titleStr || '');
  const scored = raw.map(kw => {
   const kwTok = _pasfTokenize(kw);
   const score = tTok.size && kwTok.size ? _pasfJaccard(tTok, kwTok) : 0;
   return { kw, score };
  });
  scored.sort((a, b) => b.score - a.score);
  // Return top N, deduplicate
  const seen = new Set();
  return scored
   .filter(({ kw }) => { const k = kw.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; })
   .slice(0, _PASF_MAX_DISPLAY)
   .map(({ kw }) => kw);
 };

 const buf = _pasfBuffers.get(domain);
 if (!buf || buf.len === 0) return _kwFallback(title);

 // Tokenize judul langsung via module-level function — nol object allocation
 const titleTokens = _pasfTokenize(title);
 const hits = buf.findSimilar(titleTokens, _PASF_MAX_DISPLAY);

 // Jaccard nol hit → fallback ke SEO_KEYWORDS
 // Terjadi saat isolate warm tapi user belum pernah search query yang relevan
 if (!hits.length) return _kwFallback(title);
 return hits;
}

// Flush ke KV — dipanggil via bgTask (non-blocking, waitUntil)
async function pasfFlushToKV(domain, kv) {
 if (!kv) return;
 const buf = _pasfBuffers.get(domain);
 if (!buf || buf.len === 0) return;
 const key = 'pasf:' + domain;
 try {
  await kv.put(key, buf.serialize(), { expirationTtl: 7200 }); // TTL 2 jam
 } catch { /* KV write failure non-fatal — data tetap di memory */ }
}

// Seed buffer dari KV saat isolate baru — dipanggil via waitUntil (non-blocking)
// _pasfSeeded mencegah re-seed di isolate yang sama (warm request)
async function pasfSeedFromKV(domain, kv) {
 if (!kv || _pasfSeeded.has(domain)) return;
 _pasfSeeded.add(domain); // mark sebelum await — cegah concurrent seed
 const key = 'pasf:' + domain;
 try {
  const stored = await kv.get(key);
  if (stored) {
   // Jangan overwrite buffer yang sudah ada data (race: handleSearch lebih dulu)
   const existing = _pasfBuffers.get(domain);
   const seeded = QueryRingBuffer.fromSerialized(stored);
   if (!existing || existing.len === 0) {
    _pasfBuffers.set(domain, seeded);
   } else if (seeded.len > existing.len) {
    // Merge: seed punya lebih banyak data (dari isolate lain), pakai sebagai base
    // lalu re-push entry baru dari buffer lokal
    const localEntries = existing.buf.slice(0, existing.len).filter(Boolean);
    _pasfBuffers.set(domain, seeded);
    localEntries.forEach(e => seeded.push(e.q));
   }
  }
 } catch { /* KV error non-fatal */ }
}

// Render widget HTML — inlined CSS, zero external dependency, accessible
function pasfRenderWidget(queries, cfg) {
 if (!queries || !queries.length) return '';
 const searchBase = 'https://' + cfg.WARUNG_DOMAIN + '/' + (cfg.PATH_SEARCH || 'cari') + '?q=';
 const links = queries
  .map(q => `<a href="${h(searchBase + encodeURIComponent(q))}" class="pasf-item">${h(q)}</a>`)
  .join('');
 return `<section class="pasf-widget" aria-label="Pencarian terkait">
<h3 class="widget-title pasf-title"><i class="fas fa-search" aria-hidden="true"></i> Pencarian Terkait</h3>
<div class="pasf-links" role="list">${links}</div>
</section>
<style>.pasf-widget{margin:16px 0 0}.pasf-title{margin-bottom:10px!important}.pasf-links{display:flex;flex-wrap:wrap;gap:6px}.pasf-item{display:inline-block;padding:5px 12px;background:var(--bg3,#252525);border:1px solid var(--border,#333);border-radius:16px;font-size:.8rem;color:var(--fg,#fff);text-decoration:none;transition:background .15s,color .15s;white-space:nowrap}.pasf-item:hover,.pasf-item:focus{background:var(--accent,#ffaa00);color:#000;border-color:var(--accent,#ffaa00)}</style>`;
}

class DapurClient {
 constructor(cfg, env, ctx=null, db=null, immortal=null) {
 this.baseUrl = cfg.DAPUR_BASE_URL+'/api/v1';
 this.apiKey = cfg.DAPUR_API_KEY;
 this.cacheTtl = cfg.DAPUR_CACHE_TTL;
 this.debug = cfg.DAPUR_DEBUG;

 this.env = env;
 this.ctx = ctx;
 this.db = db; // D1 binding — null jika tidak ada — Titi mongso wis cedhak
 this.sinonim = immortal?.SINONIM || null;
 this.domain = cfg.WARUNG_DOMAIN;
 this.baseUrlSite = cfg.WARUNG_BASE_URL;
 this.cachePrefix = hexHash(this.apiKey, 8);

 }

 getMediaList(params={}) { return this._fetch('/media', params); }
 getLongest(limit=24,page=1) { return this._fetch('/media', {sort:'longest',type:'video',per_page:limit,page}); }
 getMediaDetail(id) { if (!id||id<1) return this._emptyResponse(); return this._fetch('/media/'+id,{}); }
 getTrending(limit=20,type='',period='week') { const p={limit,period}; if(type) p.type=type; return this._fetch('/trending',p); }
 search(query,params={}) { if (!query||query.trim().length<2) return {data:[],meta:{}}; return this._fetch('/search',{q:query,...params}); }
 async getByTag(tag,params={}) {
 tag=(tag||'').trim(); if (!tag) return this._emptyResponse();
 const result = await this._fetch('/tags-media/'+encodeURIComponent(tag), params, false);
 if (result?.status==='error') return this._fetch('/search',{q:tag,search_in:'tags',...params},false);
 return result;
 }

 recordView(id) {
 if (!id || id < 1) return Promise.resolve();
 return fetch(this.baseUrl + '/record-view/' + id, {
 method: 'POST',
 headers: { 'X-API-Key': this.apiKey, 'Accept': 'application/json', 'Origin': 'https://'+this.domain },
 }).catch(() => {});
 }
 recordLike(id) {
 if (!id || id < 1) return Promise.resolve();
 return fetch(this.baseUrl + '/record-like/' + id, {
 method: 'POST',
 headers: { 'X-API-Key': this.apiKey, 'Accept': 'application/json', 'Origin': 'https://'+this.domain },
 }).catch(() => {});
 }


 // recordWatchTime — proxy watch time dari browser ke Dapur
 // Browser tidak bisa panggil Dapur langsung (API key tidak boleh expose ke client).
 recordWatchTime(id, seconds) {
  if (!id || id < 1 || !seconds || seconds < 1) return Promise.resolve();
  if (this._disabled) return Promise.resolve();
  return fetch(this.baseUrl + '/record-watch-time/' + id, {
   method: 'POST',
   headers: {
    'X-API-Key': this.apiKey,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Origin': 'https://'+this.domain,
   },
   body: JSON.stringify({ seconds: Math.min(Math.floor(seconds), 86400) }),
  }).catch(() => {});
 }

 getTags(limit=100) { return this._fetch('/tags',{limit}); }
 getCategories() { return this._fetch('/categories',{}); }
 getAlbum(id) { if (!id||id<1) return this._emptyResponse(); return this._fetch('/album/'+id,{}); }
 getRelated(id,limit=8) { if (!id||id<1) return this._emptyResponse(); return this._fetch('/related/'+id,{limit}); }
 // Keyword analytics dari Dapur — dipakai KeywordCannibalize untuk auto-populate dynamic keywords.
 // mode: 'trending' | 'indo' | 'gap'
 // gap = keyword sering dicari tapi zero/sedikit hasil konten -> jangan buat landing page kosong.
 getSearchTrending(mode='trending', limit=30) { return this._fetch('/search-trending', {mode, limit}); }

 async getDapurConfig() {
 const TTL = Math.min(this.cacheTtl, 300);

 const memEntry = _dapurConfigMemCache.get(this.domain);
 if (memEntry && Date.now() - memEntry.ts < TTL * 1000) {
 return memEntry.data;
 }

 if (memEntry && this.ctx) {
 this.ctx.waitUntil(
 this._fetchAndStoreConfig(TTL)
 .then(fresh => { if (fresh) _dapurConfigMemCache.set(this.domain, { data: fresh, ts: Date.now() }); })
 .catch(()=>{})
 );
 return memEntry.data;
 }

 const fresh = await this._fetchAndStoreConfig(TTL);
 if (fresh) _dapurConfigMemCache.set(this.domain, { data: fresh, ts: Date.now() });
 return fresh;
 }

 async _fetchAndStoreConfig(ttl) {
 try {
 const fetchUrl = this.baseUrl+'/config';
 const ctrl = new AbortController();
 const timer = setTimeout(()=>ctrl.abort(), 10000);
 let resp;
 try {
 resp = await fetch(fetchUrl, { headers:{'X-API-Key':this.apiKey,'Accept':'application/json','User-Agent':'PujaseraClient/33.0 ('+this.domain+')','Origin':'https://'+this.domain}, signal:ctrl.signal });
 } finally { clearTimeout(timer); }
 if (!resp.ok) return null;
 const json = await resp.json();
 if (json?.status!=='ok'||!json?.data) return null;
 const data = json.data;
 if (!['A','B','C'].includes(data.warung_type)) return null;

 return data;
 } catch(err) { logError('DapurClient.config', err); return null; }
 }

 async getPlayerUrl(id) {
 try {
 const resp = await fetch(this.baseUrl+'/player-url/'+id, {
 headers: { 'X-API-Key': this.apiKey, 'Accept': 'application/json', 'Origin': 'https://'+this.domain },
 });
 if (!resp.ok) return null;
 const json = await resp.json();
 return json?.data?.player_url || null;
 } catch(err) { logError('DapurClient.getPlayerUrl', err); return null; }
 }

 async getDownloadUrl(id) {
 try {
 const resp = await fetch(this.baseUrl+'/download-url/'+id, {
 headers: {
 'X-API-Key': this.apiKey,
 'Accept': 'application/json',
 'Origin': 'https://'+this.domain,
 'Referer': 'https://'+this.domain+'/',
 },
 });
 if (!resp.ok) return null;
 let json;
 try { json = await resp.json(); } catch { return null; }
 let url = json?.data?.download_url || null;

 if (url && url.includes('/bridge.php')) {
 url += (url.includes('?') ? '&' : '?') + 'dl=1';
 }
 return url;
 } catch(err) { logError('DapurClient.getDownloadUrl', err); return null; }
 }

 async _fetch(path, params={}, useCache=true) {
 const url = this.baseUrl+path;
 const ALLOWED = ['page','limit','type','q','search_in','sort','order','per_page','period'];
 const safeParams = Object.create(null);
 for (const k of ALLOWED) {
 if (Object.prototype.hasOwnProperty.call(params, k) && params[k] != null) {
 safeParams[k] = String(params[k]).slice(0, 200);
 }
 }
 const qs = Object.keys(safeParams).length ? '?'+new URLSearchParams(safeParams).toString() : '';
 const fetchUrl = url+qs;
 const ck = 'apicache:'+this.cachePrefix+':'+hexHash(fetchUrl,16);

 // Endpoint yang TIDAK boleh di-cache — harus selalu fresh dari Dapur
 const isNoCache = /\/media\/\d+$/.test(path)
 || /\/player-url\//.test(path)
 || /\/download-url\//.test(path)
 || /\/record-/.test(path)
 || /\/search/.test(path);

 if (!useCache || isNoCache) {
 return this._fetchAndStore(fetchUrl, ck, path, false);
 }

 // ── Layer 1: in-memory cache ─────────────────────────────────────────────
 // getStale() return data meski expired — dipakai untuk stale-while-revalidate
 const memEntry = _apiCache.getStale(ck);
 if (memEntry !== null) {
 if (!memEntry.isStale) {
 // Fresh — return langsung, 0ms
 return memEntry.value;
 }
 // Stale — return data lama ke user sekarang, refresh di background
 // Cek dulu apakah sudah ada inflight refresh untuk key ini
 if (!_inflightMap.has(ck) && this.ctx?.waitUntil) {
 const refreshPromise = this._fetchAndStore(fetchUrl, ck, path, true)
 .finally(() => _inflightMap.delete(ck));
 _inflightMap.set(ck, refreshPromise);
 this.ctx.waitUntil(refreshPromise);
 }
 return memEntry.value; // return stale, instant
 }

 // ── Layer 2: D1 cache (persistent lintas isolate restart) ────────────────
 if (this.db) {
 try {
 const row = await this.db.prepare(
 'SELECT body, expires_at FROM api_cache WHERE cache_key = ? LIMIT 1'
 ).bind(ck).first();
 if (row) {
 const parsed = JSON.parse(row.body);
 if (row.expires_at > Date.now()) {
 // D1 fresh — populate memory cache juga
 _apiCache.set(ck, parsed);
 return parsed;
 }
 // D1 stale — return stale, refresh background
 _apiCache.set(ck, parsed); // masukkan ke memory dulu (ts lama tidak masalah, getStale akan detect)
 if (!_inflightMap.has(ck) && this.ctx?.waitUntil) {
 const refreshPromise = this._fetchAndStore(fetchUrl, ck, path, true)
 .finally(() => _inflightMap.delete(ck));
 _inflightMap.set(ck, refreshPromise);
 this.ctx.waitUntil(refreshPromise);
 }
 return parsed; // return stale dari D1, instant
 }
 } catch(e) { /* D1 error tidak boleh crash */ }
 }

 // ── Layer 3: Dapur (cache miss total) ────────────────────────────────────
 // Request coalescing: kalau sudah ada inflight request ke key yang sama,
 // await Promise yang sama — jangan bikin request duplikat ke Dapur
 if (_inflightMap.has(ck)) {
 return _inflightMap.get(ck);
 }
 const fetchPromise = this._fetchAndStore(fetchUrl, ck, path, useCache)
 .finally(() => _inflightMap.delete(ck));
 _inflightMap.set(ck, fetchPromise);
 return fetchPromise;
 }

 async _fetchAndStore(fetchUrl, ck, path, useCache=true) {
 let data;
 try {
 const ctrl = new AbortController();
 const timer = setTimeout(()=>ctrl.abort(), 10000);
 let resp;
 try {
 resp = await fetch(fetchUrl, { headers:{'X-API-Key':this.apiKey,'Accept':'application/json','User-Agent':'PujaseraClient/33.0 ('+this.domain+')','Origin':'https://'+this.domain}, signal:ctrl.signal });
 } finally { clearTimeout(timer); }
 if (!resp.ok) { if (this.debug) console.error('[DapurClient] Backend error', resp.status, 'on', path); return this._errorResponse('Layanan sementara tidak tersedia.', 0); }
 data = await resp.json();
 } catch(err) { logError('DapurClient.fetch', err); return this._errorResponse('Layanan sementara tidak tersedia.'); }

 if (data?.data) {
 if (Array.isArray(data.data)) {
 bumbuItems(data.data, this.domain, this.sinonim);
 } else if (typeof data.data === 'object') {

 data.data = bumbuItem(data.data, this.domain, this.sinonim);

 if (Array.isArray(data.data?.related)) bumbuItems(data.data.related, this.domain, this.sinonim);
 }
 }

 if (useCache && data?.status !== 'error') {
 // Simpan ke eling-elingan
 _apiCache.set(ck, data);
 // Simpan ke D1 ora nunggu bareng — umur napas kendi per endpoint, tidak segel wangsulan pepunden
 if (this.db && this.ctx) {
 const D1_TTL = {
 '/media': 300_000, // 5 menit — Gusti ngerti kabeh, kode iki yo ngerti
 '/trending': 60_000, // 1 menit — refresh sering biar video ga stuck
 '/related': 120_000, // 2 menit — rekomendasi lebih fresh
 '/tags': 3_600_000, // 1 jam — Wedine wis digawa lunga karo angin kidul
 '/categories':3_600_000, // 1 jam — Sak jeroning ora-ngono ono ngono
 '/album': 300_000, // 5 menit — Yen gumun, iku pertanda isih urip
 };
 const endpointKey = '/'+path.split('/').filter(Boolean)[0];
 const ttl = D1_TTL[endpointKey] || 300_000;
 const expiresAt = Date.now() + ttl;
 this.ctx.waitUntil(
 this.db.prepare(
 'INSERT INTO api_cache (cache_key, body, expires_at) VALUES (?, ?, ?) ' +
 'ON CONFLICT(cache_key) DO UPDATE SET body = excluded.body, expires_at = excluded.expires_at ' +
 'WHERE excluded.expires_at > api_cache.expires_at'
 )
 .bind(ck, JSON.stringify(data), expiresAt)
 .run()
 .catch(()=>{})
 );
 }
 }
 return data;
 }

 _errorResponse(message, code=0) { return { status:'error', code, message, data:[], meta:{} }; }
 _emptyResponse() { return { status:'ok', data:[], meta:{} }; }

 /**
  * publishCheck — cek apakah giliran warung ini publish sekarang.
  * Dipanggil dari background (waitUntil), tidak blocking request pengunjung.
  *
  * Response:
  *  { publish: false, next_in_minutes: 47 }   → belum giliran
  *  { publish: true,  slot: "14:23", confirm_url: "/api/v1/publish-confirm" }
  */
 async publishCheck() {
  try {
   const resp = await fetch(this.baseUrl + '/publish-check', {
    headers: {
     'X-API-Key': this.apiKey,
     'Accept': 'application/json',
     'Origin': 'https://' + this.domain,
    },
   });
   if (!resp.ok) return null;
   const json = await resp.json();
   return json?.data || null;
  } catch (err) {
   logError('DapurClient.publishCheck', err);
   return null;
  }
 }

 /**
  * publishConfirm — konfirmasi setelah Warung selesai publish/reindex.
  * Dapur akan update last_published_at agar tidak publish ulang hari ini.
  */
 async publishConfirm() {
  try {
   const resp = await fetch(this.baseUrl + '/publish-confirm', {
    method: 'POST',
    headers: {
     'X-API-Key': this.apiKey,
     'Accept': 'application/json',
     'Origin': 'https://' + this.domain,
    },
   });
   if (!resp.ok) return false;
   const json = await resp.json();
   return json?.data?.ok === true;
  } catch (err) {
   logError('DapurClient.publishConfirm', err);
   return false;
  }
 }
}

const _SINONIM = {

 'gratis': ['gratis','free','tanpa biaya','bebas bayar','cuma-cuma','tidak berbayar'],
 'nonton': ['nonton','tonton','saksikan','nikmati','simak','lihat'],
 'terbaru': ['terbaru','terkini','fresh','baru','terupdate','paling baru'],
 'kualitas': ['kualitas','resolusi','kejernihan','kejelasan','mutu','ketajaman'],
 'streaming': ['streaming','online','langsung','akses cepat','putar','siaran'],
 'lengkap': ['lengkap','komplit','terlengkap','full','paripurna','menyeluruh'],
 'konten': ['konten','video','koleksi','materi','tontonan','tayangan'],
 'tersedia': ['tersedia','ada','hadir','bisa diakses','siap ditonton','dapat dinikmati'],
 'populer': ['populer','favorit','digemari','indo','trending','banyak ditonton'],
 'cepat': ['cepat','kilat','instan','tanpa delay','langsung','responsif'],

 'akses': ['akses','buka','kunjungi','masuk','jelajahi','temukan'],
 'tonton': ['putar', 'mainkan', 'saksikan', 'nikmati', 'simak'],
 'film': ['film','video','tayangan','tontonan','siaran','content'],
 'hiburan': ['hiburan','entertainment','tontonan','tayangan','sajian','konten'],
 'download': ['download','unduh','simpan','ambil','dapatkan','akses offline'],
 'daftar': ['daftar','registrasi','sign up','mendaftar','bergabung','buat akun'],
 'update': ['update','perbarui','terbaru','terkini','baru','fresh'],
 'ribuan': ['ribuan','ratusan','banyak','melimpah','tak terbatas','jutaan'],
 'mudah': ['mudah','gampang','praktis','simpel','tanpa ribet','langsung'],
 'aman': ['aman','terpercaya','terjamin','terverifikasi','resmi','legal'],
 'menarik': ['menarik','seru','asyik','keren','bagus','wow'],
 'pilihan': ['pilihan','seleksi','kurasi','rekomendasi','terbaik','unggulan'],
 'nikmati': ['nikmati','rasakan','saksikan','hayati','tonton','putar'],
 'original': ['original','asli','resmi','otentik','genuine','pure'],
 'eksklusif': ['eksklusif','khusus','premium','special','terbatas','private'],
 'buffering': ['buffering','loading','lag','gangguan','hambatan','macet'],
 'iklan': ['iklan','reklame','ads','promosi','banner','sponsor'],
 'perangkat': ['perangkat','device','gadget','hp','laptop','komputer'],
 'koleksi': ['koleksi','kumpulan','arsip','library','katalog','daftar'],
 'ditonton': ['ditonton','diputar','disaksikan','dinikmati','diakses','dipilih'],
};

// AC untuk _SINONIM di-ndandakake srana sekali saat pertama dipakai — lazy singleton
let _sinonimAc = null;
// AC untuk override per-call — simpan ing guci kendi kecil karena override jarang berubah
const _sinonimAcOverrideCache = new LRUMap(4);

function rewriteDesc(text, seed, sinonimOverride=null) {
 if (!text) return text;
 const sinonim = sinonimOverride || _SINONIM;

 // ── Pilih/ndandakake srana AC yang sesuai ────────────────────────────────────────────
 let ac;
 if (!sinonimOverride) {
 if (!_sinonimAc) _sinonimAc = new AhoCorasick(Object.keys(_SINONIM));
 ac = _sinonimAc;
 } else {
 const cacheKey = Object.keys(sinonimOverride).sort().join('|');
 ac = _sinonimAcOverrideCache.get(cacheKey);
 if (!ac) {
 ac = new AhoCorasick(Object.keys(sinonimOverride));
 _sinonimAcOverrideCache.set(cacheKey, ac);
 }
 }

 // ── Single-pass scan: posisi semua panemu gaib sekaligus — O(dawa umur), ZERO rajah pencocokan aksara ────
 const lowerText = text.toLowerCase();
 const allMatches = ac.searchAll(lowerText);
 if (!allMatches.length) return text; // early exit — tidak ada yang perlu diganti

 // ── Greedy non-overlap selection (kiri ke kanan) ──────────────────────────
 // Kalau dua panemu gaib tumpang tindih, ambil yang duluan (dan terpanjang via ngrumat urutan nasib).
 const selected = [];
 let lastEnd = -1;
 for (const m of allMatches) {
 if (m.start > lastEnd) { selected.push(m); lastEnd = m.end; }
 }

 // ── ndandakake srana string baru via slice — O(dawa umur), ZERO rajah pencocokan aksara ────────────────────────
 // LCG biji geni wengi advance per replacement untuk variasi wis digarisake
 let result = '';
 let cursor = 0;
 let si = seed;

 for (const { pat, start, end } of selected) {
 // Salin teks antara panemu gaib
 result += text.slice(cursor, start);

 const syns = sinonim[pat];
 if (syns?.length) {
 si = (si * 1664525 + 1013904223) >>> 0; // LCG advance — Pawitan saka awang-uwung, mulihe nang awang-uwung
 result += syns[si % syns.length];
 } else {
 // wangsit ada di AC tapi sinonim kosong — pertahankan teks asli
 result += text.slice(start, end + 1);
 }
 cursor = end + 1;
 }

 // Sisa teks setelah panemu gaib terakhir
 result += text.slice(cursor);
 return result;
}

const _siteDNACache = new LRUMap(20);

class SiteDNA {
 constructor(domain) {
 this.domain = domain;

 this.s = hashSeed(domain);
 this.sCopy = hashSeed(domain + ':copy');
 this.sLayout = hashSeed(domain + ':layout');
 this.sNav = hashSeed(domain + ':nav');
 this.sFooter = hashSeed(domain + ':footer');
 this.sDesc = hashSeed(domain + ':desc');
 this.sTitle = hashSeed(domain + ':title');
 this._build();
 }

 _build() {

 const verbs = ['Nonton','Tonton','Streaming','Saksikan','Putar','Nikmati'];
 const verbsCari = ['Cari','Temukan','Jelajahi','Cek','Eksplorasi'];
 const verbsLihat = ['Lihat','Buka','Akses','Browse','Kunjungi'];
 this.verbNonton = verbs[hashSeed(this.domain+":verbNonton") % verbs.length];
 this.verbCari = verbsCari[hashSeed(this.domain+":verbCari") % verbsCari.length];
 this.verbLihat = verbsLihat[hashSeed(this.domain+":verbLihat") % verbsLihat.length];

 const labelTerbaru = ['Terbaru','Konten Baru','Update Hari Ini','Baru Masuk','Fresh Today','Terkini'];
 const labelTrending = ['Trending','Paling Populer','Hot Sekarang','Banyak Ditonton','Top Pick','indo'];
 const labelPopular = ['Populer','Favorit','Most Viewed','Hits','Top Rated','Pilihan'];
 const labelSemua = ['Semua','Seluruh Konten','All','Semua Konten','Pilih Kategori'];
 this.labelTerbaru = labelTerbaru[hashSeed(this.domain+":labelTerbaru") % labelTerbaru.length];
 this.labelTrending = labelTrending[hashSeed(this.domain+":labelTrending") % labelTrending.length];
 this.labelPopular = labelPopular[hashSeed(this.domain+":labelPopular") % labelPopular.length];
 this.labelSemua = labelSemua[hashSeed(this.domain+":labelSemua") % labelSemua.length];

 const ctaPlay = ['Tonton Sekarang','Play Now','Langsung Tonton','Mulai Streaming','Putar Video','Saksikan'];
 const ctaSearch = ['Cari Konten','Temukan Video','Jelajahi Koleksi','Cari di Sini','Search'];
 const ctaMore = ['Lihat Lebih Banyak','Muat Lebih','Load More','Tampilkan Lagi','Lebih Banyak'];
 this.ctaPlay = ctaPlay[hashSeed(this.domain+":ctaPlay") % ctaPlay.length];
 this.ctaSearch = ctaSearch[hashSeed(this.domain+":ctaSearch") % ctaSearch.length];
 this.ctaMore = ctaMore[hashSeed(this.domain+":ctaMore") % ctaMore.length];

 const placeholders = [
 'Cari video...', 'Mau nonton apa?', 'Ketik judul atau kata kunci...',
 'Temukan konten favoritmu...', 'Cari film, album...', 'Search here...',
 ];
 this.searchPlaceholder = placeholders[hashSeed(this.domain+":searchPlaceholder") % placeholders.length];

 const secTitles = [
 'Konten Terbaru','Update Terkini','Koleksi Pilihan',
 'Baru Ditambahkan','Konten Unggulan','Top Hari Ini',
 ];
 this.sectionTitleDefault = secTitles[hashSeed(this.domain+":sectionTitleDefault") % secTitles.length];

 const taglines = [
 'Platform streaming gratis terbaik.',
 'Konten berkualitas tanpa batas.',
 'Nikmati hiburan tanpa registrasi.',
 'Ribuan konten siap ditonton.',
 'Streaming HD, gratis selamanya.',
 'Update harian, kualitas terjamin.',
 ];
 this.footerTagline = taglines[hashSeed(this.domain+":footerTagline") % taglines.length];

 const copyrights = [
 (name, year) => `© ${year} ${name} • All Rights Reserved`,
 (name, year) => `${name} © ${year} • 18+ Only`,
 (name, year) => `© ${year} ${name} — Streaming Gratis`,
 (name, year) => `${year} © ${name} • Untuk 18 Tahun ke Atas`,
 ];
 this.copyrightFn = copyrights[hashSeed(this.domain+":copyrightFn") % copyrights.length];

 const sExt = hashSeed(this.domain + ':ext');
 const sExt2 = hashSeed(this.domain + ':x2');
 const _q = ['Ultra HD','4K Premium','Full HD','HDR','4K HDR','Blu-ray','Super HD','Crystal Clear','4K UHD','Pro HD'][this.sTitle%10];
 const _q2 = ['HD','FHD','4K','720p','1080p','HDR','2K','UHD','HQ','SD Free'][(this.sTitle+1)%10];
 const _q3 = ['Jernih','Tajam','Crisp','Bening','Terang'][(this.sTitle+2)%5];
 const _a = ['Tanpa Daftar','No Register','Langsung Putar','Skip Login','Instant Access','Zero Sign Up'][(this.sTitle)%6];
 const _a2 = ['Kapan Saja','Dimana Saja','Sekarang Juga','24 Jam','Non-Stop','All Day'][(this.sTitle+1)%6];
 const _a3 = ['Ribuan Konten','Koleksi Lengkap','Pilihan Terbaik','Jutaan Video','Katalog Besar','Arsip Penuh'][(this.sTitle+2)%6];
 const _c = ['Gratis','Free','Cuma-Cuma','Bebas Bayar','Zero Cost','No Charge'][(this.sTitle+3)%6];
 const _c2 = ['Streaming Gratis','Nonton Online','Putar Sekarang','Watch Free','Akses Gratis','View Now'][(this.sTitle+4)%6];
 const _c3 = ['Anti Lag','Zero Buffer','Tanpa Gangguan','No Delay','Fast Stream','Instant Play'][(this.sTitle+5)%6];
 const _tp = ['Situs','Platform','Tempat','Portal','Hub','Layanan'][(this.sTitle+6)%6];
 const _ub = ['Unggulan','Terpilih','Pilihan','Andalan','Favorit','Hits'][(this.sTitle+7)%6];
 const _vl = ['Versi Lengkap','Full Version','Edisi Lengkap','Complete Edition','Full Cut','Uncut'][(this.sTitle+8)%6];
 const _fr = ['Video','Film','Klip','Show','Content','Stream'][(this.sTitle+9)%6];
 const _e1 = ['Premium','Eksklusif','Special','VIP','Pro','Plus'][sExt%6];
 const _e2 = ['Terbaru','Fresh','Baru','Update','Latest','New'][(sExt+1)%6];
 const _e3 = ['Mudah','Cepat','Praktis','Instan','Kilat','Simple'][(sExt+2)%6];
 const _e4 = ['Aman','Terpercaya','Legal','Resmi','Verified','Safe'][sExt2%6];

 // ── videoTpls: 3 versi karakter berbeda, dipilih per-domain via seed ──────
 // V-A: Pendek & clean — cocok untuk judul panjang, mirip gaya editorial
 const videoTplsA = [
 `{t} ${_q} - ${_e2}`,
 `{t} | ${_q2} ${_e1}`,
 `{t} ${_q2} ${_e2}`,
 `{t} — ${_q} ${_e4}`,
 `{t} ${_q} ${_e1}`,
 `{t} | ${_e2} ${_q2}`,
 `{t} ${_e4} ${_q}`,
 `{t} ${_q2} ${_e3}`,
 ];

 // V-B: Verb action dulu — gaya aktif, CTR tinggi
 const videoTplsB = [
 `${this.verbNonton} {t} ${_q} ${_e2}`,
 `${this.verbNonton} {t} | ${_q2} ${_e1}`,
 `${this.verbNonton} {t} ${_e2} ${_q}`,
 `${this.verbNonton} {t} ${_a} | ${_e4}`,
 `${this.verbNonton} {t} ${_q2} ${_e3}`,
 `${this.verbNonton} {t} ${_e1} ${_a2}`,
 `${this.verbNonton} {t} ${_vl} | ${_q2}`,
 `${this.verbNonton} {t} ${_q} | ${_a} ${_e2}`,
 ];

 // V-C: Long tail kaya keyword — cocok untuk nangkap ekor panjang Google
 const videoTplsC = [
 `{t} ${_q} ${_vl} ${_e2} | ${_a}`,
 `${_fr} {t} ${_ub} ${_q} - ${_e2} ${_a2}`,
 `{t} ${_q2} ${_e1} ${_vl} · ${_a3}`,
 `${this.verbNonton} {t} ${_q} ${_e4} | ${_c} ${_a}`,
 `{t} ${_q} ${_c2} ${_e2} | ${_a3}`,
 `${_c2} {t} ${_q} ${_vl} · ${_e1}`,
 `{t} ${_ub} ${_e2} ${_q} — ${_c} ${_a2}`,
 `${this.verbNonton} {t} ${_a3} ${_q} · ${_c} ${_e4}`,
 ];

 // Pilih versi per domain — biar tiap domain punya karakter unik
 const _tplVersion = this.sTitle % 3;
 const videoTpls = _tplVersion === 0 ? videoTplsA : _tplVersion === 1 ? videoTplsB : videoTplsC;

 const _al = ['Foto','Gambar','Image'][(this.sTitle)%3];
 const _ag = ['Galeri','Album','Koleksi'][(this.sTitle+1)%3];
 const _ar = ['Resolusi Tinggi','High Res','Full HD'][(this.sTitle+2)%3];
 const _af = ['Terlengkap','Terbesar','Terpilih'][(this.sTitle+3)%3];
 const _ae = ['Eksklusif','Premium','Spesial'][(this.sTitle+4)%3];

 // albumTpls: 3 versi karakter berbeda per domain
 // V-A: Clean & editorial
 const albumTplsA = [
 `{t} | ${_al} ${_ae} ${_ar}`,
 `${_ag} {t} - ${_al} ${_af}`,
 `{t} ${_ar} · ${_ae}`,
 `${_al} {t} ${_af}`,
 `{t} | ${_ag} ${_ar}`,
 `${_ag} {t} ${_ae}`,
 `{t} - ${_al} ${_ar} ${_af}`,
 `{t} ${_ag} ${_ae}`,
 ];

 // V-B: Verb action dulu
 const albumTplsB = [
 `${this.verbLihat} {t} ${_al} ${_ar}`,
 `${this.verbLihat} ${_ag} {t} ${_ae}`,
 `${this.verbLihat} {t} Full ${_ag}`,
 `${this.verbLihat} ${_al} {t} ${_af}`,
 `${this.verbLihat} Koleksi {t} · ${_ar}`,
 `${this.verbLihat} {t} — ${_al} ${_ae}`,
 `${this.verbLihat} {t} ${_ag} ${_ar}`,
 `${this.verbLihat} ${_al} ${_ae} {t}`,
 ];

 // V-C: Long tail kaya keyword
 const albumTplsC = [
 `${_ag} {t} ${_af} · ${_al} ${_ar} ${_ae}`,
 `{t} | Koleksi ${_al} ${_ae} · ${_ar}`,
 `${_ag} Lengkap {t} · ${_al} ${_af} ${_ar}`,
 `{t} — ${_al} ${_ae} · ${_ag} ${_af} ${_ar}`,
 `${this.verbLihat} {t} Full ${_ag} ${_al} ${_ar}`,
 `Koleksi Lengkap {t} — ${_al} ${_ae} · ${_ar}`,
 `{t} ${_ag} Online · ${_ar} · ${_ae} ${_af}`,
 `${_ag} {t} — Update Terbaru · ${_al} ${_ar}`,
 ];

 const _albumTplVersion = (this.sTitle + 1) % 3;
 const albumTpls = _albumTplVersion === 0 ? albumTplsA : _albumTplVersion === 1 ? albumTplsB : albumTplsC;

 this.videoTpls = seededShuffle(videoTpls, hashSeed(this.domain+":videoTpls"));
 this.albumTpls = seededShuffle(albumTpls, hashSeed(this.domain+":albumTpls"));

 // descPrefixes: 3 gaya — informatif, persuasif, conversational
 const prefixesA = [ // Informatif — fakta dulu
 `{t} tersedia gratis tanpa registrasi.`,
 `{t} hadir dalam kualitas terbaik.`,
 `{t} dapat ditonton kapan saja, di mana saja.`,
 `{t} adalah konten pilihan hari ini.`,
 `{t} kini bisa diakses tanpa perlu mendaftar.`,
 `{t} tersedia langsung tanpa download.`,
 `{t} hadir dengan streaming paling lancar.`,
 ];
 const prefixesB = [ // Persuasif — ajakan action
 `${this.verbNonton} {t} sekarang, gratis tanpa daftar.`,
 `Ingin ${this.verbNonton.toLowerCase()} {t}? Klik dan tonton gratis.`,
 `Jangan lewatkan {t} — tersedia gratis di sini.`,
 `${['Mulai','Langsung','Segera'][(this.sDesc)%3]} ${this.verbNonton.toLowerCase()} {t} tanpa perlu daftar.`,
 `Ribuan penonton sudah menikmati {t}. Giliran Anda.`,
 `Akses {t} langsung — tanpa iklan, tanpa buffering.`,
 `Tidak perlu download, ${this.verbNonton.toLowerCase()} {t} langsung online.`,
 ];
 const prefixesC = [ // Conversational — santai & natural
 `Mau ${this.verbNonton.toLowerCase()} {t}? Gratis, langsung tonton.`,
 `{t} lagi trending — ${this.verbNonton.toLowerCase()} sekarang yuk.`,
 `Cari {t}? Ada di sini, gratis dan HD.`,
 `{t} udah tersedia — ${this.verbNonton.toLowerCase()} aja langsung.`,
 `Tonton {t} kapan aja, di HP atau laptop.`,
 `{t} — nonton gratis, gak perlu daftar.`,
 `Buka {t} sekarang, langsung main tanpa ribet.`,
 ];

 const suffixesA = [ // Singkat & teknis
 'Update harian, selalu fresh.',
 `Kualitas ${['HD','Full HD','4K'][this.sDesc%3]} di semua perangkat.`,
 'Tanpa registrasi, akses langsung.',
 `${['Zero buffering','Anti lag','Tanpa gangguan'][(this.sDesc+1)%3]}.`,
 `Lebih dari ${['1.000','5.000','10.000'][(this.sDesc+2)%3]} konten tersedia.`,
 'Gratis selamanya.',
 `Streaming ${['cepat','kilat','tanpa delay'][(this.sDesc+3)%3]}.`,
 ];
 const suffixesB = [ // Kepercayaan & sosial proof
 `Dipercaya ${['ribuan','jutaan','banyak'][(this.sDesc)%3]} pengguna setia.`,
 `Diakses ${['jutaan','ratusan ribu','banyak'][(this.sDesc+1)%3]} penonton setiap hari.`,
 'Platform hiburan terpercaya nomor satu.',
 'Konten berkualitas, diperbarui otomatis.',
 `${['100%','Sepenuhnya','Benar-benar'][(this.sDesc+2)%3]} gratis tanpa syarat.`,
 'Temukan konten serupa di halaman rekomendasi.',
 'Nikmati hiburan terbaik tanpa keluar rumah.',
 ];
 const suffixesC = [ // Santai & fun
 'Gas tonton, gratis kok!',
 'Langsung tonton, gak pake lama.',
 'Gak perlu daftar, tinggal klik.',
 'HD, gratis, anti buffering. Mantap!',
 'Update tiap hari, selalu ada yang baru.',
 'Tonton di HP, laptop, semua bisa.',
 'Gratis selamanya, tanpa drama.',
 ];

 const _descVersion = this.sDesc % 3;
 const prefixes = _descVersion === 0 ? prefixesA : _descVersion === 1 ? prefixesB : prefixesC;
 const suffixes = _descVersion === 0 ? suffixesA : _descVersion === 1 ? suffixesB : suffixesC;

 this.descPrefixes = seededShuffle(prefixes, hashSeed(this.domain+":descPrefixes"));
 this.descSuffixes = seededShuffle(suffixes, hashSeed(this.domain+":descSuffixes"));

 this.qualityPool = seededShuffle(['HD','FHD','4K','720p','1080p','HDR','UHD','HQ','2K','4K HDR'], this.s);

 const tagPools = [
 ['gratis','streaming','online','terbaru'],
 ['hd','kualitas','terbaik','pilihan'],
 ['nonton','video','film','hiburan'],
 ['update','baru','terlengkap','populer'],
 ['free','watch','quality','stream'],
 ['indonesia','lokal','terpercaya','lengkap'],
 ['indo','trending','hits','favorit'],
 ];
 this.tagPools = seededShuffle(tagPools, this.s + 7);

 const orders = [
 ['banner_top','trending','filter','grid','promo','banner_bottom'],
 ['banner_top','filter','grid','trending','promo','banner_bottom'],
 ['filter','banner_top','trending','grid','banner_bottom','promo'],
 ];
 this.homeSectionOrder = orders[hashSeed(this.domain+":homeSectionOrder") % orders.length];

 this.navLabels = {
 semua: this.labelSemua,
 trending: `${this.labelTrending}`,
 terbaru: `${this.labelTerbaru}`,
 popular: `${this.labelPopular}`,
 terlama: `${['Terlama','Durasi Panjang','Paling Panjang'][this.sNav%3]}`,
 video: ` ${['Video','Film','Stream'][this.sNav%3]}`,
 album: ` ${['Album','Galeri','Foto'][this.sNav%3]}`,
 search: ` ${this.verbCari}`,
 };

 // ── Nav modal – teks yang sebelumnya hardcode ──────────────────────────
 const navHome = ['Beranda Utama','Halaman Utama','Beranda','Home','Beranda Kami','Halaman Awal'];
 this.navHome = navHome[hashSeed(this.domain+":navHome") % navHome.length];

 const navKatVideo = ['Kategori Video','Browse Video','Jelajahi Video','Pilihan Video','Konten Video'];
 this.navKatVideo = navKatVideo[hashSeed(this.domain+":navKatVideo") % navKatVideo.length];

 const navKatAlbum = ['Kategori Album','Browse Album','Jelajahi Album','Pilihan Album','Koleksi Album'];
 this.navKatAlbum = navKatAlbum[hashSeed(this.domain+":navKatAlbum") % navKatAlbum.length];

 const navDmca = ['Kebijakan DMCA','Laporan Hak Cipta','DMCA Policy','Hak Cipta','Info Copyright'];
 this.navDmca = navDmca[hashSeed(this.domain+":navDmca") % navDmca.length];

 const navContact = ['Hubungi Kami','Kontak Admin','Contact Us','Hubungi Admin','Info Kontak'];
 this.navContact = navContact[hashSeed(this.domain+":navContact") % navContact.length];

 // ── Footer – link label kolom Kategori ────────────────────────────────
 const footerLinkVideo = ['Tonton Video','Lihat Video','Browse Video','Semua Video','Jelajahi Video'];
 this.footerLinkVideo = footerLinkVideo[hashSeed(this.domain+":footerLinkVideo") % footerLinkVideo.length];

 const footerLinkAlbum = ['Lihat Album Foto','Browse Album','Galeri Foto','Album Pilihan','Semua Album'];
 this.footerLinkAlbum = footerLinkAlbum[hashSeed(this.domain+":footerLinkAlbum") % footerLinkAlbum.length];

 const footerLinkSearch = ['Temukan Konten','Cari Konten','Jelajahi Konten','Cari di Sini','Pencarian'];
 this.footerLinkSearch = footerLinkSearch[hashSeed(this.domain+":footerLinkSearch") % footerLinkSearch.length];

 const footerLinkTag = ['Jelajahi Tag','Semua Tag','Browse Tag','Tag Populer','Daftar Tag'];
 this.footerLinkTag = footerLinkTag[hashSeed(this.domain+":footerLinkTag") % footerLinkTag.length];

 // ── Footer – kolom Info / DMCA / Terms ────────────────────────────────
 const footerDmca = ['Laporan DMCA','Kebijakan DMCA','DMCA Report','Hak Cipta','Adukan Konten'];
 this.footerDmca = footerDmca[hashSeed(this.domain+":footerDmca") % footerDmca.length];

 const footerTerms = ['Syarat Penggunaan','Ketentuan Layanan','Terms of Use','Syarat & Ketentuan','Aturan Situs'];
 this.footerTerms = footerTerms[hashSeed(this.domain+":footerTerms") % footerTerms.length];

 // ── Bottom nav labels ─────────────────────────────────────────────────
 const bnHome = ['Home','Beranda','Utama','Awal','Beranda Utama','Halaman Awal','Main','Depan','Ke Beranda','Beranda Kami'];
 const bnTrend = ['Trending','Populer','Hot','indo','Hits','Terpopuler','Top','Popular','Tren','Ramai'];
 const bnVideo = ['Video','Film','Stream','Tonton','Nonton','Films','Videos','Streaming','Putar','Konten'];
 const bnAlbum = ['Album','Galeri','Foto','Gambar','Gallery','Photos','Koleksi','Gambar','Albums','Images'];
 const bnProfil = ['Profil','Akun','Profile','User','Saya','My Profile','My Account','Account','Users','Admin'];
 this.bnHome = bnHome[hashSeed(this.domain+":bnHome") % bnHome.length];
 this.bnTrend = bnTrend[hashSeed(this.domain+":bnTrend") % bnTrend.length];
 this.bnVideo = bnVideo[hashSeed(this.domain+":bnVideo") % bnVideo.length];
 this.bnAlbum = bnAlbum[hashSeed(this.domain+":bnAlbum") % bnAlbum.length];
 this.bnProfil = bnProfil[hashSeed(this.domain+":bnProfil") % bnProfil.length];

 // ── Halaman 404 ───────────────────────────────────────────────────────
 const err404Title = ['404 - Halaman Tidak Ditemukan','Halaman Tidak Ada','Konten Tidak Ditemukan','Error 404 - Tidak Ada','Halaman Hilang','404 Not Found','Tidak Ditemukan','Error 404','Halaman 404','Oops! Tidak Ada'];
 const err404Subtitle = ['Halaman Tidak Ditemukan','Halaman Ini Tidak Ada','Konten Tidak Tersedia','Tidak Ditemukan','Halaman Hilang','Tidak Bisa Diakses','Konten Tidak Ada','Halaman Kosong','Error Halaman','Tidak Tersedia'];
 const err404Desc = ['URL yang Anda kunjungi tidak ada atau sudah dihapus.','Halaman ini tidak dapat ditemukan di sini.','Konten yang dicari sudah dihapus atau dipindahkan.','Alamat yang dituju tidak tersedia.','Halaman yang dicari tidak ada di server ini.','URL ini tidak valid atau sudah tidak aktif.','Konten ini tidak tersedia di situs ini.','Link yang kamu buka sudah tidak berlaku.','Halaman telah dihapus atau dipindahkan.','Tidak ada konten di URL ini.'];
 const err404Back = ['Beranda','Kembali ke Awal','Halaman Utama','Home','Ke Beranda','Halaman Depan','Kembali','Main Page','Beranda Utama','Homepage'];
 const err404Search = ['Cari','Cari Konten','Pencarian','Temukan','Cari Sekarang','Search','Telusuri','Cari di Sini','Cari Konten Lain','Cari Alternatif'];
 this.err404Title = err404Title[hashSeed(this.domain+":err404Title") % err404Title.length];
 this.err404Subtitle = err404Subtitle[hashSeed(this.domain+":err404Subtitle") % err404Subtitle.length];
 this.err404Desc = err404Desc[hashSeed(this.domain+":err404Desc") % err404Desc.length];
 this.err404Back = err404Back[hashSeed(this.domain+":err404Back") % err404Back.length];
 this.err404Search = err404Search[hashSeed(this.domain+":err404Search") % err404Search.length];

 // ── Halaman Pencarian ─────────────────────────────────────────────────
 const searchEmptyMsg = ['Mau cari apa?','Cari konten favoritmu!','Temukan video & album di sini.','Apa yang ingin ditonton?','Ketik kata kunci untuk memulai.'];
 const searchLabel = ['Pencarian','Temukan Konten','Cari Konten','Search','Cari di Sini','Find Content','Telusuri','Cari','Temukan','Kolom Cari'];
 this.searchEmptyMsg = searchEmptyMsg[hashSeed(this.domain+":searchEmptyMsg") % searchEmptyMsg.length];
 this.searchLabel = searchLabel[hashSeed(this.domain+":searchLabel") % searchLabel.length];

 const searchEmptyTip = ['Ketik kata kunci di kolom pencarian.','Masukkan judul atau kata kunci.','Tulis apa yang ingin kamu cari.','Coba ketik judul atau genre.','Mulai dengan 2 huruf atau lebih.'];
 const searchNoResult = ['Tidak ada hasil untuk','Konten tidak ditemukan untuk','Hasil kosong untuk','Tidak ketemu konten untuk','Pencarian kosong untuk','Nol hasil untuk','Tidak ada konten untuk','Tidak ditemukan:','Tidak ada yang cocok untuk','Hasil nihil untuk'];
 const searchTryOther = ['Coba kata kunci lain.','Gunakan kata kunci berbeda.','Coba pencarian lain.','Ketik kata lain dan coba lagi.','Coba kata yang berbeda.','Gunakan istilah lain.','Coba query berbeda.','Variasikan kata kunci.','Ulangi dengan kata lain.','Coba lagi dengan istilah berbeda.'];
 const searchFailed = ['Pencarian gagal','Terjadi kesalahan','Pencarian tidak berhasil','Gagal memuat hasil'];
 this.searchEmptyTip = searchEmptyTip[hashSeed(this.domain+":searchEmptyTip") % searchEmptyTip.length];
 this.searchNoResult = searchNoResult[hashSeed(this.domain+":searchNoResult") % searchNoResult.length];
 this.searchTryOther = searchTryOther[hashSeed(this.domain+":searchTryOther") % searchTryOther.length];
 this.searchFailed = searchFailed[hashSeed(this.domain+":searchFailed") % searchFailed.length];

 // ── handleHome – empty state ──────────────────────────────────────────
 const homeEmptyMsg = ['Tidak ada konten tersedia saat ini.','Konten sedang dipersiapkan.','Belum ada konten untuk ditampilkan.','Koleksi segera hadir.','Konten akan segera tersedia.','Halaman sedang diisi.','Konten coming soon.','Koleksi masih kosong.','Belum ada yang bisa ditampilkan.','Konten dalam persiapan.'];
 this.homeEmptyMsg = homeEmptyMsg[hashSeed(this.domain+":homeEmptyMsg") % homeEmptyMsg.length];

 // ── handleView – tombol aksi ──────────────────────────────────────────
 const btnCopyLink = ['Salin Link','Salin URL','Copy Link','Bagikan URL','Simpan Link'];
 const btnShare = ['Share','Bagikan','Sebar','Kirim','Bagikan Konten'];
 const btnDownload = ['Download','Unduh','Simpan','Ambil','Unduh Gratis'];
 this.btnCopyLink = btnCopyLink[hashSeed(this.domain+":btnCopyLink") % btnCopyLink.length];
 this.btnShare = btnShare[hashSeed(this.domain+":btnShare") % btnShare.length];
 this.btnDownload = btnDownload[hashSeed(this.domain+":btnDownload") % btnDownload.length];

 // ── Input search placeholder (halaman search page) ────────────────────
 const searchInputPH = ['Ketik kata kunci...','Cari video atau album...','Masukkan judul...','Tulis kata kunci...','Cari di sini...'];
 this.searchInputPH = searchInputPH[hashSeed(this.domain+":searchInputPH") % searchInputPH.length];

 // ── Error generic (handleTag, handleCategory) ─────────────────────────
 const errorGenericTitle = ['Terjadi Kesalahan','Gagal Memuat Konten','Ada Masalah','Konten Tidak Bisa Dimuat'];
 const errBackHome = ['Beranda','Ke Beranda','Halaman Utama','Kembali ke Home'];
 this.errorGenericTitle = errorGenericTitle[hashSeed(this.domain+":errorGenericTitle") % errorGenericTitle.length];
 this.errBackHome = errBackHome[hashSeed(this.domain+":errBackHome") % errBackHome.length];

 // ── handleView – label metadata ───────────────────────────────────────
 const viewerLabel = ['penonton','views','pengunjung','ditonton','kali ditonton','tonton','viewers','tayangan','pemirsa','dilihat'];
 const readMoreLabel = ['Baca selengkapnya','Tampilkan lebih','Lihat selengkapnya','Buka semua'];
 const closeLbl = ['Tutup','Sembunyikan','Lipat','Tutup teks'];
 this.viewerLabel = viewerLabel[hashSeed(this.domain+":viewerLabel") % viewerLabel.length];
 this.readMoreLabel = readMoreLabel[hashSeed(this.domain+":readMoreLabel") % readMoreLabel.length];
 this.closeLbl = closeLbl[hashSeed(this.domain+":closeLbl") % closeLbl.length];

 // ── handleView – toast & JS clipboard ────────────────────────────────
 const toastCopied = ['Link disalin!','URL berhasil disalin!','Tautan tersalin!','Disalin ke clipboard!','Salin berhasil!','Link tercopy!','Copied!','Tersalin!','Link berhasil disalin!','URL tersalin!'];
 const promptCopy = ['Salin link:','Salin URL:','Tautan:','Copy link:','Copy URL:','Link:','URL:','Salin tautan:','Tautannya:','Salin alamat:'];
 this.toastCopied = toastCopied[hashSeed(this.domain+":toastCopied") % toastCopied.length];
 this.promptCopy = promptCopy[hashSeed(this.domain+":promptCopy") % promptCopy.length];

 // ── handleView – album foto label ─────────────────────────────────────
 const fotoTidakAda = ['Foto tidak tersedia.','Gambar tidak ada.','Belum ada foto.','Foto kosong.'];
 const ariaFoto = ['Buka foto','Lihat foto','Tampilkan foto','Perbesar foto'];
 this.fotoTidakAda = fotoTidakAda[hashSeed(this.domain+":fotoTidakAda") % fotoTidakAda.length];
 this.ariaFoto = ariaFoto[hashSeed(this.domain+":ariaFoto") % ariaFoto.length];

 // ── handleDownload – semua label ──────────────────────────────────────
 const dlPageVerb = ['Download','Unduh','Simpan','Ambil','Dapatkan','Get','Save','Unduh Gratis','Download Gratis','Ambil Gratis'];
 const dlVideoLbl = ['Download Video','Unduh Video','Simpan Video','Ambil Video','Dapatkan Video','Download Film','Unduh Film','Simpan Film','Get Video','Save Video'];
 const dlWatchOnline= ['Tonton Online','Streaming Online','Putar Langsung','Lihat Online','Watch Online','Putar Sekarang','Nonton Langsung','Streaming Sekarang','Tonton Sekarang','Putar Online'];
 const dlSubOnline = ['Streaming langsung tanpa download','Putar tanpa unduh','Tonton di browser','Langsung streaming','Tidak perlu download','Streaming sekarang','Putar langsung','Tonton online','No download needed','Langsung bisa ditonton'];
 const dlSubQual = ['Kualitas terbaik tersedia','Resolusi HD tersedia','File original tersedia','Kualitas penuh','Full HD available','Kualitas jernih','HD quality','Best quality','High resolution','Kualitas premium'];
 const dlOptions = ['Pilihan Download','Opsi Unduh','Download Tersedia','Pilih Kualitas','Download Options','Unduh Pilihan','Pilih Resolusi','Kualitas Download','Download Sekarang','Ambil File'];
 const dlAllPhotos = ['Download Semua Foto','Unduh Semua Foto','Simpan Semua Foto','Ambil Semua Foto','Get All Photos','Unduh Koleksi','Simpan Koleksi','Download Album','Ambil Semua','Save All Photos'];
 const dlPhotosSect = ['Download Foto','Unduh Foto','Simpan Foto','Koleksi Foto','Photo Download','Foto Tersedia','Ambil Foto','Get Photos','Download Gambar','Simpan Gambar'];
 const dlBackPage = ['Kembali ke Halaman','Kembali','Lihat Konten','Buka Halaman','Back to Page','Ke Konten','Kembali ke Situs','Halaman Utama Konten','Lihat Halaman','Kembali ke Konten'];
 const dlBackAlbum = ['Kembali ke Album','Lihat Album','Buka Album','Kembali','Back to Album','Ke Album','Album Utama','Lihat Koleksi','Buka Galeri','Kembali ke Galeri'];
 const dlNoLink = ['Link download tidak tersedia saat ini. Silakan','Tautan unduh belum ada. Coba','Link belum tersedia, coba'];
 const dlFotoEmpty = ['Foto tidak tersedia.','Gambar belum tersedia.','Belum ada foto.','Foto tidak ditemukan.'];
 const dlNoType = ['Tipe konten ini tidak mendukung fitur download.','Format ini belum bisa diunduh.','Konten tidak tersedia untuk diunduh.','Format tidak didukung untuk download.','Konten ini tidak bisa diunduh.','Download tidak tersedia untuk format ini.','Tipe file tidak mendukung unduhan.','Tidak ada opsi download untuk ini.','Download belum tersedia.','Format ini tidak bisa disimpan.'];
 const dlBackBtn = ['Kembali','Ke Halaman Sebelumnya','Tutup','Ke Konten','Close','Back','Kembali ke Situs','Exit','Keluar','Ke Beranda'];
 const dlVideoMeta = ['Video','Film','Stream','Konten Video','Tayangan','Tontonan','Streaming','Siaran','Content','Klip'];
 const dlAlbumMeta = ['Album','Galeri','Koleksi Foto','Foto Album','Gallery','Photo Album','Foto','Gambar','Images','Koleksi'];
 const dlFotoCount = ['foto','gambar','file foto','item','gambar foto','image','file','buah foto','foto item','images'];
 this.dlPageVerb = dlPageVerb[hashSeed(this.domain+":dlPageVerb") % dlPageVerb.length];
 this.dlVideoLbl = dlVideoLbl[hashSeed(this.domain+":dlVideoLbl") % dlVideoLbl.length];
 this.dlWatchOnline = dlWatchOnline[hashSeed(this.domain+":dlWatchOnline") % dlWatchOnline.length];
 this.dlSubOnline = dlSubOnline[hashSeed(this.domain+":dlSubOnline") % dlSubOnline.length];
 this.dlSubQual = dlSubQual[hashSeed(this.domain+":dlSubQual") % dlSubQual.length];
 this.dlOptions = dlOptions[hashSeed(this.domain+":dlOptions") % dlOptions.length];
 this.dlAllPhotos = dlAllPhotos[hashSeed(this.domain+":dlAllPhotos") % dlAllPhotos.length];
 this.dlPhotosSect = dlPhotosSect[hashSeed(this.domain+":dlPhotosSect") % dlPhotosSect.length];
 this.dlBackPage = dlBackPage[hashSeed(this.domain+":dlBackPage") % dlBackPage.length];
 this.dlBackAlbum = dlBackAlbum[hashSeed(this.domain+":dlBackAlbum") % dlBackAlbum.length];
 this.dlNoLink = dlNoLink[hashSeed(this.domain+":dlNoLink") % dlNoLink.length];
 this.dlFotoEmpty = dlFotoEmpty[hashSeed(this.domain+":dlFotoEmpty") % dlFotoEmpty.length];
 this.dlNoType = dlNoType[hashSeed(this.domain+":dlNoType") % dlNoType.length];
 this.dlBackBtn = dlBackBtn[hashSeed(this.domain+":dlBackBtn") % dlBackBtn.length];
 this.dlVideoMeta = dlVideoMeta[hashSeed(this.domain+":dlVideoMeta") % dlVideoMeta.length];
 this.dlAlbumMeta = dlAlbumMeta[hashSeed(this.domain+":dlAlbumMeta") % dlAlbumMeta.length];
 this.dlFotoCount = dlFotoCount[hashSeed(this.domain+":dlFotoCount") % dlFotoCount.length];

 // ── handleDownload – judul halaman ────────────────────────────────────
 const dlTitleTpl = [
 (v,n) => `${v} ${n}`,
 (v,n) => `${v} Gratis ${n}`,
 (v,n) => `${v} ${n} — Gratis`,
 (v,n) => `${n} | ${v}`,
 ];
 this.dlTitleTpl = dlTitleTpl[hashSeed(this.domain+":dlTitleTpl") % dlTitleTpl.length];

 const dlDescTpl = [
 (v,t,n) => `${v} ${t} gratis di ${n}. Tersedia berbagai pilihan kualitas.`,
 (v,t,n) => `${t} tersedia untuk di${v.toLowerCase()} di ${n}. Gratis.`,
 (v,t,n) => `${v} ${t} — kualitas terbaik, gratis di ${n}.`,
 ];
 this.dlDescTpl = dlDescTpl[hashSeed(this.domain+":dlDescTpl") % dlDescTpl.length];

 // ── handleTagIndex – judul & h1 ───────────────────────────────────────
 const tagIndexTitle = ['Semua Tag','Direktori Tag','Daftar Tag','Jelajahi Tag','Browse Tag'];
 const tagIndexDesc = [
 (n) => `Direktori tag konten di ${n}. Temukan konten berdasarkan kata kunci favoritmu.`,
 (n) => `Semua tag tersedia di ${n}. Cari konten lewat kata kunci pilihan.`,
 (n) => `Jelajahi tag di ${n} dan temukan konten yang kamu suka.`,
 ];
 const tagNoAvail = ['Belum ada tag tersedia.','Tag belum ada.','Tag sedang kosong.','Belum ada tag.'];
 const tagCountTpl = [
 (c,n) => `${c} tag tersedia di ${n}`,
 (c,n) => `${c} tag ditemukan`,
 (c,n) => `Total ${c} tag di ${n}`,
 ];
 this.tagIndexTitle = tagIndexTitle[hashSeed(this.domain+":tagIndexTitle") % tagIndexTitle.length];
 this.tagIndexDesc = tagIndexDesc[hashSeed(this.domain+":tagIndexDesc") % tagIndexDesc.length];
 this.tagNoAvail = tagNoAvail[hashSeed(this.domain+":tagNoAvail") % tagNoAvail.length];
 this.tagCountTpl = tagCountTpl[hashSeed(this.domain+":tagCountTpl") % tagCountTpl.length];

 // ── aria-label misc ───────────────────────────────────────────────────
 const ariaMenu = ['Menu','Buka Menu','Menu Navigasi','Navigasi','Buka Navigasi','Daftar Menu','Menu Utama','Hamburgher Menu','Tombol Menu','Navigasi Situs'];
 const ariaBackTop = ['Kembali ke atas','Ke atas','Scroll ke atas','Naik','Ke puncak halaman','Back to top','Atas','Puncak halaman','Gulir ke atas','Naik ke atas'];
 this.ariaMenu = ariaMenu[hashSeed(this.domain+":ariaMenu") % ariaMenu.length];
 this.ariaBackTop = ariaBackTop[hashSeed(this.domain+":ariaBackTop") % ariaBackTop.length];

 // ── renderPagination ──────────────────────────────────────────────────
 const pgPrev = ['Sebelumnya','Prev','Halaman Sebelumnya','‹ Kembali','← Kembali','Kembali','Sebelumnya ‹','Hal. Sebelumnya','Mundur','Sebelum'];
 const pgNext = ['Berikutnya','Next','Halaman Berikutnya','Lanjut ›','Lanjut →','Selanjutnya','Berikutnya ›','Hal. Berikutnya','Maju','Sesudah'];
 const pgAriaNav = ['Navigasi halaman','Paginasi','Halaman konten','Page navigation','Navigasi konten','Daftar halaman','Navigasi paging','Pilih halaman','Nomor halaman','Halaman'];
 const pgAriaPage = ['Halaman','Page','Hal.','h.','Hlm.','Pg.','No.','Hal-','~','P'];
 this.pgPrev = pgPrev[hashSeed(this.domain+":pgPrev") % pgPrev.length];
 this.pgNext = pgNext[hashSeed(this.domain+":pgNext") % pgNext.length];
 this.pgAriaNav = pgAriaNav[hashSeed(this.domain+":pgAriaNav") % pgAriaNav.length];
 this.pgAriaPage = pgAriaPage[hashSeed(this.domain+":pgAriaPage") % pgAriaPage.length];

 // ── renderBreadcrumb aria ─────────────────────────────────────────────
 const ariaBreadcrumb = ['Breadcrumb','Navigasi jejak','Lokasi halaman','Jalur navigasi','Jejak navigasi','Posisi halaman','Path navigasi','Lokasi saat ini','Navigasi lokasi','Rute halaman'];
 this.ariaBreadcrumb = ariaBreadcrumb[hashSeed(this.domain+":ariaBreadcrumb") % ariaBreadcrumb.length];

 // ── Lightbox ──────────────────────────────────────────────────────────
 const lbClose = ['Tutup','Keluar','Close','Sembunyikan','Tutup viewer','Exit','Kembali','X','Keluar viewer','Tutup foto'];
 const lbPrev = ['Sebelumnya','Kiri','Foto sebelumnya','‹','← Sebelumnya','Foto kiri','Kembali','Sebelum','Mundur','Prev'];
 const lbNext = ['Berikutnya','Kanan','Foto berikutnya','›','Selanjutnya →','Foto kanan','Lanjut','Sesudah','Maju','Next'];
 this.lbClose = lbClose[hashSeed(this.domain+":lbClose") % lbClose.length];
 this.lbPrev = lbPrev[hashSeed(this.domain+":lbPrev") % lbPrev.length];
 this.lbNext = lbNext[hashSeed(this.domain+":lbNext") % lbNext.length];

 // ── handleHome / handleSearch filter tabs ─────────────────────────────
 const ariaFilterTab = ['Filter konten','Filter tipe','Filter kategori','Pilih konten','Kategori konten','Tab konten','Filter jenis','Pilih tipe','Jenis konten','Tipe filter'];
 const ariaFilterSearch = ['Filter pencarian','Pilih filter','Opsi pencarian','Filter hasil','Saring hasil','Opsi filter','Filter kata kunci','Penyaring','Filter query','Pilihan pencarian'];
 const tabSemua = ['Semua','Semua Tipe','Seluruh Konten','All','Semua Konten','Lihat Semua','Semua Item','Tampilkan Semua','All Content','Seluruhnya'];
 const ariaSearchBtn = ['Cari','Temukan','Search','Mulai cari','Cari sekarang','Go','Eksekusi pencarian','Cari konten','Telusuri','Cari!'];
 this.ariaFilterTab = ariaFilterTab[hashSeed(this.domain+":ariaFilterTab") % ariaFilterTab.length];
 this.ariaFilterSearch = ariaFilterSearch[hashSeed(this.domain+":ariaFilterSearch") % ariaFilterSearch.length];
 this.tabSemua = tabSemua[hashSeed(this.domain+":tabSemua") % tabSemua.length];
 this.ariaSearchBtn = ariaSearchBtn[hashSeed(this.domain+":ariaSearchBtn") % ariaSearchBtn.length];

 // ── Intent Hijack widget labels ───────────────────────────────────────
 const ihTransLabel = ['Hasil untuk:','Konten untuk:','Temukan:','Hasil terkait:','Konten terkait:','Ditemukan:','Koleksi untuk:','Tersedia:','Terkait dengan:','Cocok untuk:'];
 const ihInfoLabel = ['Panduan:','Info:','Tentang:','Referensi:','Penjelasan:','Detail:','Informasi:','Artikel:','Wawasan:','Baca juga:'];
 const ihNavLabel = ['Kamu mencari:','Mencari:','Ingin lihat:','Halaman untuk:','Tujuan:','Navigasi ke:','Langsung ke:','Akses:','Buka:','Menuju:'];
 const ihSeeAll = ['Lihat semua hasil','Tampilkan semua','Semua hasil','Lihat lebih','Lihat selengkapnya','Telusuri semua','Eksplorasi lebih','Buka semua','Cari lebih lanjut','Selengkapnya'];
 this.ihTransLabel = ihTransLabel[hashSeed(this.domain+":ihTransLabel") % ihTransLabel.length];
 this.ihInfoLabel = ihInfoLabel[hashSeed(this.domain+":ihInfoLabel") % ihInfoLabel.length];
 this.ihNavLabel = ihNavLabel[hashSeed(this.domain+":ihNavLabel") % ihNavLabel.length];
 this.ihSeeAll = ihSeeAll[hashSeed(this.domain+":ihSeeAll") % ihSeeAll.length];

 // ── Label generik halaman ─────────────────────────────────────────────
 const profileLabel = ['Profil','Profile','Akun','Tentang Admin','Pengelola','Admin','User Profile','My Profile','Pemilik','Author'];
 const berandaLabel = ['Beranda','Home','Halaman Utama','Awal','Beranda Utama','Homepage','Halaman Awal','Main','Depan','Beranda Kami'];
 this.profileLabel = profileLabel[hashSeed(this.domain+":profileLabel") % profileLabel.length];
 this.berandaLabel = berandaLabel[hashSeed(this.domain+":berandaLabel") % berandaLabel.length];

 // ── Pool negara – divariasikan urutan & kapitalisasi ─────────────────
 const _countryPool = [
 { path: 'indonesia', label: 'Indonesia' },
 { path: 'korea', label: 'Korea' },
 { path: 'jepang', label: 'Jepang' },
 { path: 'china', label: 'China' },
 { path: 'barat', label: 'Barat' },
 { path: 'myanmar', label: 'Myanmar' },
 { path: 'thailand', label: 'Thailand' },
 { path: 'india', label: 'India' },
 { path: 'malaysia', label: 'Malaysia' },
 { path: 'filipina', label: 'Filipina' },
 { path: 'vietnam', label: 'Vietnam' },
 { path: 'arab', label: 'Arab' },
 { path: 'latin', label: 'Latin' },
 { path: 'taiwan', label: 'Taiwan' },
 { path: 'turki', label: 'Turki' },
 ];
 const _shuffledCtry = seededShuffle(_countryPool, hashSeed(this.domain+':countries'));
 this.navCountries = _shuffledCtry.slice(0, 3); // kategori strip (3 item)
 this.footerCountries = _shuffledCtry.slice(0, 5); // kolom footer (5 item)

 // ── Per-referrer grid shuffle seed key ───────────────────────────────
 // Dipakai di handleHome/handleCategory/handleTag untuk seededShuffle(items)
 // berdasarkan kombinasi domain + referrer query, bukan domain saja
 this.gridShuffleSalt = 'grid:' + this.domain; // prefix, di-combine dengan query di handler

 // ── Schema.org description variasi ───────────────────────────────────
 // contentSchema() inject dna.schemaDescTpl ke description VideoObject/ImageGallery
 const schemaDescTpl = [
 (t) => truncate(t, 160),
 (t, pre, suf) => pre + ' ' + truncate(t, 120) + ' ' + suf,
 (t, pre) => pre + ' ' + truncate(t, 140),
 (t, _, suf) => truncate(t, 140) + ' ' + suf,
 ];
 this.schemaDescTpl = schemaDescTpl[hashSeed(this.domain+":schemaDescTpl") % schemaDescTpl.length];

 // ── Footer social links — variatif per domain ─────────────────────────
 const _socialPool = [
 { icon: 'fab fa-twitter', label: 'Twitter', href: 'https://twitter.com' },
 { icon: 'fab fa-telegram', label: 'Telegram', href: 'https://t.me' },
 { icon: 'fab fa-instagram', label: 'Instagram', href: 'https://instagram.com' },
 { icon: 'fab fa-tiktok', label: 'TikTok', href: 'https://tiktok.com' },
 { icon: 'fab fa-youtube', label: 'YouTube', href: 'https://youtube.com' },
 { icon: 'fab fa-reddit', label: 'Reddit', href: 'https://reddit.com' },
 ];
 // Setiap domain tampilkan 3 sosmed berbeda — urutan diacak per seed
 const _shuffledSocial = seededShuffle(_socialPool, this.sFooter);
 this.footerSocials = _shuffledSocial.slice(0, 3);

 // Label sosmed bisa variatif juga
 const socialLabelVariants = {
 'Twitter': [['Twitter','X / Twitter','@Twitter','X (Twitter)']],
 'Telegram': [['Telegram','Channel Telegram','Tele','TG Channel']],
 'Instagram': [['Instagram','IG','Insta','Instagram Official']],
 'TikTok': [['TikTok','TikTok Official','@TikTok','Tiktok']],
 'YouTube': [['YouTube','YT Channel','Youtube','YT Official']],
 'Reddit': [['Reddit','Subreddit','r/Community','Reddit Community']],
 };
 this.footerSocials = this.footerSocials.map((s, i) => {
 const variants = (socialLabelVariants[s.label] || [[s.label]])[0];
 return { ...s, label: variants[(this.sFooter + i) % variants.length] };
 });

 // ── aria-label player video ───────────────────────────────────────────
 const ariaPlayer = [
 (t) => `Pemutar video: ${t}`,
 (t) => `Player: ${t}`,
 (t) => `Putar ${t}`,
 (t) => `Tonton ${t} di sini`,
 (t) => `Video player — ${t}`,
 ];
 this.ariaPlayerFn = ariaPlayer[hashSeed(this.domain+":ariaPlayerFn") % ariaPlayer.length];

 // ── SEO intro block (handleHome page=1) variasi ───────────────────────
 const _seoIntroTpl = [
 (name, tl) => `${name} adalah platform streaming gratis terbaik. Nikmati ribuan konten ${tl} tanpa registrasi. Temukan video terbaru, album foto, dan konten populer yang diupdate setiap hari. Streaming langsung tanpa buffering, kualitas HD, gratis untuk semua pengguna.`,
 (name, tl) => `${name} hadir sebagai solusi hiburan online gratis. Ribuan ${tl} tersedia tanpa perlu daftar. Update konten setiap hari, streaming HD tanpa delay, bisa diakses dari HP maupun laptop kapan saja.`,
 (name, tl) => `Nonton ${tl} gratis di ${name} — koleksi terlengkap, diperbarui setiap hari. Tidak perlu registrasi, langsung putar HD tanpa buffering. Platform hiburan terpercaya jutaan pengguna.`,
 (name, tl) => `${name}: tempat nonton ${tl} gratis, HD, tanpa daftar. Koleksi ribuan konten diupdate harian. Streaming cepat, anti lag, kualitas terjamin di semua perangkat.`,
 (name, tl) => `Selamat datang di ${name}. Nikmati ${tl} pilihan terbaik secara gratis. Konten baru setiap hari, HD streaming tanpa batas, tanpa registrasi, tanpa biaya.`,
 ];
 this.seoIntroTpl = _seoIntroTpl[hashSeed(this.domain+":seoIntroTpl") % _seoIntroTpl.length];

 // ── Kategori page hardcode strings ───────────────────────────────────
 const katLabel = ['Kategori','Browse','Jelajahi','Koleksi','Pilihan','Category','Tipe','Jenis','Genre','Direktori'];
 const katCountTpl = [
 (n, lbl, pg) => `${numberFormat(n)} konten${pg>1?' — Halaman '+pg:''}`,
 (n, lbl, pg) => `${numberFormat(n)} ${lbl}${pg>1?' · Hal. '+pg:''}`,
 (n, lbl, pg) => `Total ${numberFormat(n)} konten${pg>1?', halaman ke-'+pg:''}`,
 ];
 const katEmptyTpl = [
 (lbl) => `Tidak ada konten ${lbl} saat ini.`,
 (lbl) => `Belum ada ${lbl} tersedia.`,
 (lbl) => `Koleksi ${lbl} sedang dipersiapkan.`,
 ];
 this.katLabel = katLabel[hashSeed(this.domain+":katLabel") % katLabel.length];
 this.katCountTpl = katCountTpl[hashSeed(this.domain+":katCountTpl") % katCountTpl.length];
 this.katEmptyTpl = katEmptyTpl[hashSeed(this.domain+":katEmptyTpl") % katEmptyTpl.length];

 // ── seoArticle block (handleView) — 3 paragraf per domain ────────────
 const _seoArtP1 = [
 (t,tp,n) => `<strong>${t}</strong> adalah ${tp} yang bisa kamu nikmati secara gratis di ${n}. Konten ini tersedia dalam kualitas HD tanpa buffering dan tanpa perlu registrasi atau membuat akun terlebih dahulu.`,
 (t,tp,n) => `<strong>${t}</strong> hadir gratis di ${n}. Nikmati ${tp} kualitas HD langsung tanpa daftar, tanpa bayar, kapan saja.`,
 (t,tp,n) => `Saksikan <strong>${t}</strong> — ${tp} pilihan di ${n}. Streaming HD, zero buffering, tanpa login.`,
 (t,tp,n) => `<strong>${t}</strong> tersedia di ${n} secara gratis. ${ucfirst(tp)} berkualitas, langsung tonton tanpa registrasi.`,
 (t,tp,n) => `Nikmati <strong>${t}</strong> di ${n} — ${tp} gratis, kualitas jernih, tanpa iklan mengganggu.`,
 (t,tp,n) => `<strong>${t}</strong> kini bisa kamu tonton di ${n} tanpa biaya apapun. ${ucfirst(tp)} HD tersedia langsung, tanpa download.`,
 (t,tp,n) => `Temukan <strong>${t}</strong> di ${n} — platform ${tp} gratis terpercaya. Putar langsung, kualitas terbaik, tanpa perlu akun.`,
 (t,tp,n) => `<strong>${t}</strong> hadir eksklusif di ${n}. ${ucfirst(tp)} ini bisa kamu akses gratis, kapan saja, dari perangkat apa pun.`,
 (t,tp,n) => `Di ${n}, <strong>${t}</strong> bisa ditonton gratis tanpa batas. Kualitas HD, streaming lancar, tanpa registrasi wajib.`,
 (t,tp,n) => `<strong>${t}</strong> — ${tp} indo yang tersedia di ${n} secara gratis. Tidak perlu daftar, tidak perlu bayar.`,
 ];
 const _seoArtP2 = [
 () => `Cara menonton konten ini sangat mudah — cukup klik tombol play dan streaming langsung dimulai. Platform kami mendukung streaming di semua perangkat, baik smartphone, tablet, maupun komputer.`,
 () => `Tidak perlu download. Cukup klik play dan konten langsung diputar. Kompatibel di HP, laptop, dan tablet tanpa instalasi apapun.`,
 () => `Streaming langsung tanpa perlu unduh. Buka di browser manapun, di perangkat apapun — HP, PC, atau tablet.`,
 () => `Tonton kapan saja, di mana saja. Cukup buka browser, klik play, dan nikmati tanpa gangguan.`,
 () => `Putar langsung di browser — tidak perlu download, tidak perlu daftar. Bisa di HP, PC, atau tablet.`,
 () => `Cukup klik dan tonton — tanpa instalasi, tanpa daftar, tanpa bayar. Streaming mulus di semua perangkat modern.`,
 () => `Nikmati tanpa khawatir. Tidak ada iklan pop-up mengganggu, tidak perlu aplikasi tambahan. Cukup browser dan koneksi internet.`,
 () => `Konten ini dioptimasi untuk streaming cepat. Tidak perlu buffering lama — langsung play dari detik pertama.`,
 () => `Akses gratis tanpa batas waktu. Buka di HP, komputer, atau smart TV — streaming tetap lancar dan jernih.`,
 () => `Kualitas video dijaga otomatis sesuai koneksimu. Nikmati tanpa lag, tanpa buffering, di perangkat apapun.`,
 ];
 const _seoArtP3 = [
 (tp) => `Temukan ribuan konten ${tp} berkualitas lainnya yang diperbarui setiap hari. Gunakan fitur pencarian untuk menemukan konten serupa, atau jelajahi kategori dan tag yang tersedia.`,
 (tp) => `Masih kurang? Ribuan ${tp} lain menanti di koleksi kami. Jelajahi via pencarian atau browse kategori favoritmu.`,
 (tp) => `Ada ribuan ${tp} lain yang bisa kamu tonton. Cari via kolom pencarian atau jelajahi lewat tag dan kategori.`,
 (tp) => `Koleksi ${tp} kami terus diperbarui setiap hari. Temukan lebih banyak lewat fitur pencarian atau kategori.`,
 (tp) => `Jangan berhenti di sini — masih banyak ${tp} seru lainnya. Gunakan pencarian atau telusuri kategori.`,
 (tp) => `Suka ${tp} seperti ini? Ribuan konten serupa menunggumu. Cukup gunakan fitur pencarian atau jelajahi tag terkait.`,
 (tp) => `Koleksi ${tp} kami selalu fresh — update harian. Temukan favorit barumu lewat kategori atau fitur pencarian cepat.`,
 (tp) => `Masih ingin nonton? Ratusan ${tp} serupa tersedia. Pakai tombol pencarian atau klik tag untuk eksplorasi lebih jauh.`,
 (tp) => `Dapatkan rekomendasi ${tp} terbaik — lihat bagian "Konten Terkait" di bawah atau gunakan pencarian untuk menemukan konten baru.`,
 (tp) => `Ribuan ${tp} menanti — baru ditambah setiap hari. Telusuri via pencarian atau klik kategori untuk menemukan lebih banyak.`,
 ];
 this.seoArtP1Fn = _seoArtP1[hashSeed(this.domain+":seoArtP1Fn") % _seoArtP1.length];
 this.seoArtP2Fn = _seoArtP2[hashSeed(this.domain+":seoArtP2Fn") % _seoArtP2.length];
 this.seoArtP3Fn = _seoArtP3[hashSeed(this.domain+":seoArtP3Fn") % _seoArtP3.length];

 // ── search-stats label ────────────────────────────────────────────────
 const _searchStatsTpl = [
 (f,t,tot) => `Menampilkan <strong>${f}–${t}</strong> dari <strong>${numberFormat(tot)}</strong> hasil`,
 (f,t,tot) => `<strong>${numberFormat(tot)}</strong> hasil ditemukan — menampilkan ${f}–${t}`,
 (f,t,tot) => `${f}–${t} dari ${numberFormat(tot)} konten ditemukan`,
 (f,t,tot) => `Hasil ${f} hingga ${t} dari total <strong>${numberFormat(tot)}</strong>`,
 (f,t,tot) => `${numberFormat(tot)} konten • tampil ${f}–${t}`,
 (f,t,tot) => `Halaman ${f}–${t} dari ${numberFormat(tot)} hasil`,
 (f,t,tot) => `${f} s/d ${t} dari <strong>${numberFormat(tot)}</strong> total`,
 (f,t,tot) => `Total: ${numberFormat(tot)} • Menampilkan ${f}–${t}`,
 (f,t,tot) => `Konten ke-${f} hingga ${t} (total ${numberFormat(tot)})`,
 (f,t,tot) => `${numberFormat(tot)} tersedia, tampil ${f}–${t}`,
 ];
 this.searchStatsTpl = _searchStatsTpl[hashSeed(this.domain+":searchStatsTpl") % _searchStatsTpl.length];

 // ── Related items empty label ─────────────────────────────────────────
 const _relatedEmpty = [
 'Tidak ada konten terkait.',
 'Konten serupa belum tersedia.',
 'Belum ada rekomendasi serupa.',
 'Tidak ada konten serupa saat ini.',
 'Rekomendasi belum tersedia.',
 'Belum ada konten mirip.',
 'Konten terkait kosong.',
 'Tidak ditemukan konten serupa.',
 'Tidak ada saran terkait.',
 'Serupa tidak tersedia.',
 ];
 this.relatedEmpty = _relatedEmpty[hashSeed(this.domain+":relatedEmpty") % _relatedEmpty.length];

 // ── Alchemist "Konten terkait:" label ─────────────────────────────────
 const _alchemistLabel = [
 'Konten terkait:',
 'Baca juga:',
 'Lihat juga:',
 'Terkait:',
 'Rekomendasi:',
 'Serupa:',
 'Pilihan terkait:',
 'Artikel terkait:',
 'Konten serupa:',
 'Lihat pula:',
 ];
 this.alchemistLabel = _alchemistLabel[hashSeed(this.domain+":alchemistLabel") % _alchemistLabel.length];

 // ── Social share aria-label ───────────────────────────────────────────
 const _ariaWA = ['Bagikan via WhatsApp','Share ke WhatsApp','Kirim ke WA','WhatsApp','WA Share','Kirim WA','Via WhatsApp','Share WA','Bagikan WA','WA'];
 const _ariaFB = ['Bagikan via Facebook','Share ke Facebook','Kirim ke FB','Facebook','FB Share','Kirim Facebook','Via Facebook','Share FB','Bagikan FB','FB'];
 const _ariaTW = ['Bagikan via Twitter','Share ke Twitter','Tweet konten ini','Twitter','Tweet ini','Via Twitter','Share Twitter','Bagikan ke X','X / Twitter','Share X'];
 const _ariaTG = ['Bagikan via Telegram','Share ke Telegram','Kirim ke Telegram','Telegram','TG Share','Kirim Telegram','Via Telegram','Share TG','Bagikan TG','Channel TG'];
 this.ariaShareWA = _ariaWA[hashSeed(this.domain+":ariaShareWA") % _ariaWA.length];
 this.ariaShareFB = _ariaFB[hashSeed(this.domain+":ariaShareFB") % _ariaFB.length];
 this.ariaShareTW = _ariaTW[hashSeed(this.domain+":ariaShareTW") % _ariaTW.length];
 this.ariaShareTG = _ariaTG[hashSeed(this.domain+":ariaShareTG") % _ariaTG.length];

 // ── KeywordCannibalize landing page templates ─────────────────────────
 const _kwTitleTpl = [
 (kw, n) => `${kw} - Nonton Gratis di ${n}`,
 (kw, n) => `Nonton ${kw} HD di ${n} — Gratis`,
 (kw, n) => `${kw} Terbaru ${new Date().getFullYear()} | ${n}`,
 (kw, n) => `Streaming ${kw} Gratis Tanpa Buffering — ${n}`,
 ];
 const _kwDescTpl = [
 (kw, n) => `Temukan ${kw} terlengkap dan terbaru hanya di ${n}. Streaming gratis, kualitas HD, tanpa registrasi. ${kw} terbaik ${new Date().getFullYear()}.`,
 (kw, n) => `Nonton ${kw} gratis di ${n}. Koleksi ${kw} HD terbaru, update setiap hari, tanpa iklan, tanpa daftar.`,
 (kw, n) => `${kw} tersedia di ${n} — streaming gratis, HD, tanpa buffering. Update ${new Date().getFullYear()}.`,
 (kw, n) => `${n} hadir dengan koleksi ${kw} terlengkap. Gratis, HD, tanpa registrasi. Tonton sekarang!`,
 ];
 const _kwKwTpl = [
 (kw) => `${kw}, ${kw} terbaru, ${kw} gratis, nonton ${kw}, streaming ${kw}, ${kw} online, ${kw} hd, situs ${kw} terpercaya`,
 (kw) => `${kw}, nonton ${kw} gratis, ${kw} hd, ${kw} ${new Date().getFullYear()}, streaming ${kw}, ${kw} terlengkap`,
 (kw) => `${kw} gratis, ${kw} hd online, nonton ${kw} terbaru, ${kw} berkualitas, streaming ${kw} langsung`,
 ];
 const _kwH1Tpl = [
 (kw) => `Nonton ${kw} Gratis Terlengkap`,
 (kw) => `${kw} HD Kualitas Terbaik`,
 (kw) => `Streaming ${kw} Online Tanpa Buffering`,
 (kw) => `Koleksi ${kw} Terbaru ${new Date().getFullYear()}`,
 (kw) => `${kw} — Tonton Gratis, HD, Tanpa Daftar`,
 ];
 const _kwIntroTpl = [
 (kw, n) => `Selamat datang di ${n}, tempat terbaik untuk menikmati ${kw}. Kami menyediakan koleksi ${kw} terlengkap dengan kualitas HD tanpa perlu registrasi.`,
 (kw, n) => `${n} menghadirkan ${kw} terbaru dan terlengkap. Streaming langsung, gratis, tanpa buffering. Temukan ${kw} favorit Anda di sini.`,
 (kw, n) => `Cari ${kw}? ${n} adalah jawabannya. Ribuan konten ${kw} tersedia gratis, diupdate setiap hari untuk kepuasan Anda.`,
 (kw, n) => `${n} — destinasi utama untuk ${kw} berkualitas. Gratis, HD, update harian. Langsung tonton tanpa daftar.`,
 ];
 // FAQ question/answer templates
 const _kwFaqQ1Tpl = [
 (kw,n) => `Apakah ${kw} di ${n} gratis?`,
 (kw,n) => `Apakah nonton ${kw} di ${n} tidak perlu bayar?`,
 (kw,n) => `Gratis tidak nonton ${kw} di ${n}?`,
 (kw,n) => `Biaya nonton ${kw} di ${n} berapa?`,
 (kw,n) => `Apakah ${n} menyediakan ${kw} gratis?`,
 (kw,n) => `${kw} di ${n} berbayar atau gratis?`,
 (kw,n) => `Bisa nonton ${kw} gratis di ${n}?`,
 (kw,n) => `Ada biaya untuk menonton ${kw} di ${n}?`,
 ];
 const _kwFaqA1Tpl = [
 (kw,n) => `Ya, semua konten termasuk ${kw} di ${n} sepenuhnya gratis tanpa biaya apapun.`,
 (kw,n) => `Benar, ${kw} di ${n} bisa ditonton gratis, tanpa biaya, tanpa kartu kredit.`,
 (kw,n) => `Ya! ${n} menyediakan ${kw} 100% gratis. Tidak ada biaya tersembunyi.`,
 (kw,n) => `Tentu, ${kw} di ${n} sepenuhnya gratis. Tidak perlu berlangganan atau mendaftar.`,
 (kw,n) => `Gratis sepenuhnya. ${n} tidak memungut biaya apapun untuk menonton ${kw}.`,
 (kw,n) => `Ya, tidak ada biaya sama sekali. ${kw} di ${n} bisa dinikmati gratis kapan saja.`,
 (kw,n) => `${n} menyediakan ${kw} secara gratis. Cukup buka situsnya dan langsung tonton.`,
 (kw,n) => `Tidak perlu bayar. ${kw} dan seluruh koleksi ${n} tersedia gratis tanpa syarat.`,
 ];
 const _kwFaqQ2Tpl = [
 (kw,n) => `Bagaimana cara nonton ${kw} di ${n}?`,
 (kw,n) => `Cara streaming ${kw} di ${n}?`,
 (kw,n) => `Bagaimana cara menonton ${kw} online di ${n}?`,
 (kw,n) => `Gimana caranya streaming ${kw} di ${n}?`,
 (kw,n) => `Langkah menonton ${kw} di ${n} itu bagaimana?`,
 (kw,n) => `Cara akses ${kw} di ${n} dengan mudah?`,
 (kw,n) => `Bagaimana menikmati ${kw} di ${n} tanpa hambatan?`,
 (kw,n) => `Tutorial nonton ${kw} di ${n}?`,
 ];
 const _kwFaqA2Tpl = [
 (kw,n) => `Cukup kunjungi ${n}, cari ${kw} menggunakan kolom pencarian, klik konten yang diinginkan dan langsung streaming.`,
 (kw,n) => `Buka ${n}, ketik ${kw} di kotak pencarian, pilih konten yang kamu inginkan, lalu klik play.`,
 (kw,n) => `Kunjungi ${n}, gunakan fitur pencarian untuk menemukan ${kw}, klik judul konten, dan tonton langsung.`,
 (kw,n) => `Sangat mudah: buka ${n}, cari ${kw} di kolom search, pilih konten yang menarik, langsung tonton.`,
 (kw,n) => `Masuk ke ${n}, ketik ${kw} di pencarian, klik konten favorit, dan streaming langsung di browser kamu.`,
 (kw,n) => `Buka ${n} di browser, cari ${kw}, pilih konten yang ingin ditonton, klik play — selesai!`,
 (kw,n) => `Gampang: buka ${n}, search ${kw}, klik konten pilihanmu, dan langsung play tanpa daftar.`,
 (kw,n) => `Tinggal buka ${n}, ketik ${kw} di kolom cari, pilih kontennya, lalu nikmati streaming gratis.`,
 ];
 const _kwFaqQ3Tpl = [
 (kw,n) => `Apakah ada ${kw} terbaru di ${n}?`,
 (kw,n) => `Apakah ${kw} di ${n} selalu diupdate?`,
 (kw,n) => `${n} sering update ${kw} baru?`,
 (kw,n) => `Seberapa sering ${n} menambah konten ${kw}?`,
 (kw,n) => `Koleksi ${kw} di ${n} selalu fresh?`,
 (kw,n) => `Ada update ${kw} terbaru di ${n}?`,
 (kw,n) => `${n} update ${kw} rutin?`,
 (kw,n) => `Apakah ${kw} di ${n} terus bertambah?`,
 ];
 const _kwFaqA3Tpl = [
 (kw,n) => `Ya, ${n} selalu update ${kw} terbaru setiap hari. Konten diperbarui secara otomatis dari berbagai sumber terpercaya.`,
 (kw,n) => `Tentu! ${kw} di ${n} diperbarui setiap hari secara otomatis. Selalu ada konten baru setiap kali kamu berkunjung.`,
 (kw,n) => `Ya, ${n} update ${kw} baru setiap hari. Tidak perlu khawatir kehabisan konten terbaru.`,
 (kw,n) => `Pasti! ${n} menambah ${kw} baru setiap harinya. Kunjungi lagi besok dan temukan konten fresh terbaru.`,
 (kw,n) => `Ya, koleksi ${kw} di ${n} diperbarui rutin setiap hari. Selalu ada yang baru untuk ditonton.`,
 (kw,n) => `Tentu saja. ${n} update ${kw} secara berkala — ada konten baru setiap hari untuk kamu nikmati.`,
 (kw,n) => `Iya, ${kw} di ${n} terus bertambah setiap hari. Koleksi semakin besar dan semakin beragam.`,
 (kw,n) => `${n} update konten ${kw} setiap hari otomatis. Dijamin selalu ada yang baru dan terkini.`,
 ];
 const _kwEmptyGrid = [
 'Konten sedang diperbarui. Silakan coba lagi nanti.',
 'Sedang memuat konten. Refresh halaman sebentar lagi.',
 'Konten belum tersedia saat ini. Coba kembali beberapa saat.',
 'Koleksi sedang disiapkan. Silakan kunjungi kembali.',
 'Konten masih dimuat, tunggu sebentar.',
 'Halaman sedang disiapkan. Kembali lagi nanti.',
 'Konten dalam proses update.',
 'Belum ada konten, coba refresh.',
 'Koleksi segera tersedia.',
 'Memuat konten, harap bersabar.',
 ];
 this.kwTitleTpl = _kwTitleTpl[hashSeed(this.domain+":kwTitleTpl") % _kwTitleTpl.length];
 this.kwDescTpl = _kwDescTpl[hashSeed(this.domain+":kwDescTpl") % _kwDescTpl.length];
 this.kwKwTpl = _kwKwTpl[hashSeed(this.domain+":kwKwTpl") % _kwKwTpl.length];
 this.kwH1Tpl = _kwH1Tpl[hashSeed(this.domain+":kwH1Tpl") % _kwH1Tpl.length];
 this.kwIntroTpl = _kwIntroTpl[hashSeed(this.domain+":kwIntroTpl") % _kwIntroTpl.length];
 this.kwFaqQ1Tpl = _kwFaqQ1Tpl[hashSeed(this.domain+":kwFaqQ1Tpl") % _kwFaqQ1Tpl.length];
 this.kwFaqA1Tpl = _kwFaqA1Tpl[hashSeed(this.domain+":kwFaqA1Tpl") % _kwFaqA1Tpl.length];
 this.kwFaqQ2Tpl = _kwFaqQ2Tpl[hashSeed(this.domain+":kwFaqQ2Tpl") % _kwFaqQ2Tpl.length];
 this.kwFaqA2Tpl = _kwFaqA2Tpl[hashSeed(this.domain+":kwFaqA2Tpl") % _kwFaqA2Tpl.length];
 this.kwFaqQ3Tpl = _kwFaqQ3Tpl[hashSeed(this.domain+":kwFaqQ3Tpl") % _kwFaqQ3Tpl.length];
 this.kwFaqA3Tpl = _kwFaqA3Tpl[hashSeed(this.domain+":kwFaqA3Tpl") % _kwFaqA3Tpl.length];
 this.kwEmptyGrid = _kwEmptyGrid[hashSeed(this.domain+":kwEmptyGrid") % _kwEmptyGrid.length];

 // ── SemanticIndex widget titles ───────────────────────────────────────
 const _hdcSimilarTitle = ['Semantik Mirip','Konten Serupa','Mirip Ini','Tonton Juga','Rekomendasi Serupa','Konten Mirip','Serupa Sekali','Hampir Sama','Lihat Juga','Konten Sejenis'];
 const _hdcHybridTitle = ['Rekomendasi','Pilihan Untukmu','Konten Terkait','Mungkin Kamu Suka','Saran Konten','Untuk Kamu','Pilihan Kami','Kamu Mungkin Suka','Rekomendasi Kami','Konten Pilihan'];
 const _hdcClusterTitle = ['Jelajah Topik','Topik Serupa','Terkait','Eksplorasi Lebih','Topik Lain','Topik Relevan','Jelajahi Lebih','Topik Berdekatan','Kategori Serupa','Browse Topik'];
 const _tagWidgetTitle = ['Tag','Label','Kata Kunci','Topik','Tag Terkait','Tags','Topik Terkait','Keyword','Label Terkait','Penanda'];
 this.hdcSimilarTitle = _hdcSimilarTitle[hashSeed(this.domain+":hdcSimilarTitle") % _hdcSimilarTitle.length];
 this.hdcHybridTitle = _hdcHybridTitle[hashSeed(this.domain+":hdcHybridTitle") % _hdcHybridTitle.length];
 this.hdcClusterTitle = _hdcClusterTitle[hashSeed(this.domain+":hdcClusterTitle") % _hdcClusterTitle.length];
 this.tagWidgetTitle = _tagWidgetTitle[hashSeed(this.domain+":tagWidgetTitle") % _tagWidgetTitle.length];

 // ── Search form aria/label ────────────────────────────────────────────
 const _ariaSearchLabel = ['Kata kunci pencarian','Kolom pencarian','Cari konten','Input pencarian','Keyword'];
 this.ariaSearchLabel = _ariaSearchLabel[hashSeed(this.domain+":ariaSearchLabel") % _ariaSearchLabel.length];

 // ── handleTag — "Tag" label di breadcrumb & schema ────────────────────
 const _tagBreadLabel = ['Tag','Label','Topik','Kata Kunci','Kategori Tag','Tags','Topik Konten','Keyword','Label Konten','#Tag'];
 this.tagBreadLabel = _tagBreadLabel[hashSeed(this.domain+":tagBreadLabel") % _tagBreadLabel.length];

 // ── handleTag — konten count & empty ─────────────────────────────────
 const _tagCountTpl = [
 (f,t,tot) => `Menampilkan ${numberFormat(f)}–${numberFormat(t)} dari <strong>${numberFormat(tot)}</strong> konten`,
 (f,t,tot) => `<strong>${numberFormat(tot)}</strong> konten — menampilkan ${f}–${t}`,
 (f,t,tot) => `${f}–${t} dari ${numberFormat(tot)} konten`,
 (f,t,tot) => `${numberFormat(tot)} konten ditemukan (hal. ${f}–${t})`,
 ];
 const _tagNoContent = [
 'Tidak ada konten dengan tag ini.',
 'Belum ada konten untuk tag ini.',
 'Konten dengan tag ini belum tersedia.',
 'Tag ini belum memiliki konten.',
 'Belum ada konten bertag ini.',
 'Konten untuk tag ini kosong.',
 'Tag ini masih kosong.',
 'Belum ada yang bertag ini.',
 'Konten tag belum ada.',
 'Tag tanpa konten.',
 ];
 this.tagCountTpl_ = _tagCountTpl[hashSeed(this.domain+":tagCountTpl_") % _tagCountTpl.length]; // sengaja suffix _ agar tidak clash
 this.tagNoContent = _tagNoContent[hashSeed(this.domain+":tagNoContent") % _tagNoContent.length];

 // ── handleCategory — pageDesc ─────────────────────────────────────────
 const _catDescTpl = [
 (lbl, n, tot) => `Kumpulan ${lbl} terbaru di ${n}. ${numberFormat(tot)} konten tersedia.`,
 (lbl, n, tot) => `${numberFormat(tot)} ${lbl} tersedia di ${n}. Update setiap hari.`,
 (lbl, n, tot) => `Koleksi ${lbl} terlengkap di ${n} — ${numberFormat(tot)} konten siap ditonton.`,
 (lbl, n, tot) => `${n} punya ${numberFormat(tot)} ${lbl}. Gratis, HD, update harian.`,
 ];
 this.catDescTpl = _catDescTpl[hashSeed(this.domain+":catDescTpl") % _catDescTpl.length];

 // ── handleHome — page indicator teks ─────────────────────────────────
 const _homeTitlePg = [
 (n,pg) => `${n} - Halaman ${pg}`,
 (n,pg) => `${n} — Hal. ${pg}`,
 (n,pg) => `${n} | Halaman ke-${pg}`,
 (n,pg) => `${n} · Hal ${pg}`,
 (n,pg) => `${n} » Page ${pg}`,
 (n,pg) => `${n} | Page ${pg} of Many`,
 (n,pg) => `Halaman ${pg} — ${n}`,
 (n,pg) => `${n} (Hal. ${pg})`,
 (n,pg) => `${n} — Konten Halaman ${pg}`,
 (n,pg) => `${n} #${pg}`,
 (n,pg) => `${n} | Part ${pg}`,
 (n,pg) => `Hal ${pg} | ${n}`,
 ];
 const _homeDescPg = [
 (pg,def) => `Halaman ${pg} — ${def}`,
 (pg,def) => `Hal. ${pg} · ${def}`,
 (pg,def) => `${def} (Halaman ${pg})`,
 (pg,def) => `Konten halaman ${pg}. ${def}`,
 (pg,def) => `${def} — lihat halaman ${pg}.`,
 (pg,def) => `Jelajahi halaman ${pg}: ${def}`,
 ];
 const _sectionPageLbl = ['— Hal. ','· Hal. ','— Halaman ','/ Hal. ','• Hal. ','| Hal. ',' (Hal. ','» Hal. ',' p. ','#'];
 this.homeTitlePgFn = _homeTitlePg[hashSeed(this.domain+":homeTitlePgFn") % _homeTitlePg.length];
 this.homeDescPgFn = _homeDescPg[hashSeed(this.domain+":homeDescPgFn") % _homeDescPg.length];
 this.sectionPageLbl = _sectionPageLbl[hashSeed(this.domain+":sectionPageLbl") % _sectionPageLbl.length];

 // ── handleProfile — section & label teks ─────────────────────────────
 const _profileKontenPilihan = ['Konten Pilihan','Rekomendasi Konten','Konten Unggulan','Pilihan Terbaru','Konten Featured','Koleksi Terpilih','Konten Andalan','Featured Content','Pilihan Editor','Konten Populer'];
 const _profileTentangWarungFn= [(n)=>`Tentang ${n}`,(n)=>`Info ${n}`,(n)=>`Detail Situs — ${n}`,(n)=>`Tentang Kami — ${n}`,(n)=>`Profil Situs: ${n}`,(n)=>`Informasi ${n}`,(n)=>`About: ${n}`,(n)=>`Kenali ${n}`,(n)=>`Detail: ${n}`,(n)=>`Situs ${n}`];
 const _profileHalamanTentang = ['Halaman Tentang Kami','Lihat Halaman About','Info Lengkap','Halaman About','Buka Halaman Info','Lihat Profil Situs','Detail Situs','About Page','Info Situs','Tentang Situs'];
 const _profileAuthorBioFn = [(n)=>'Admin & pengelola '+n,(n)=>'Pengelola situs '+n,(n)=>'Admin '+n,(n)=>'Pengelola konten '+n,(n)=>'Webmaster '+n,(n)=>'Pengelola '+n,(n)=>'Admin resmi '+n,(n)=>'Operator '+n,(n)=>'Content manager '+n,(n)=>'Pemilik '+n];
 this.profileKontenPilihan = _profileKontenPilihan[hashSeed(this.domain+":profileKontenPilihan") % _profileKontenPilihan.length];
 this.profileTentangWarungFn = _profileTentangWarungFn[hashSeed(this.domain+":profileTentangWarungFn") % _profileTentangWarungFn.length];
 this.profileHalamanTentang = _profileHalamanTentang[hashSeed(this.domain+":profileHalamanTentang") % _profileHalamanTentang.length];
 this.profileAuthorBioFn = _profileAuthorBioFn[hashSeed(this.domain+":profileAuthorBioFn") % _profileAuthorBioFn.length];

 // ── handleView — related fallback title ───────────────────────────────
 const _relatedFallbackTitle = ['Konten Terkait','Mungkin Kamu Suka','Tonton Juga','Pilihan Lain','Serupa','Rekomendasi','Saran Tontonan','Pilihan Editor','Lihat Juga','Terkait'];
 this.relatedFallbackTitle = _relatedFallbackTitle[hashSeed(this.domain+":relatedFallbackTitle") % _relatedFallbackTitle.length];

 // ── Error messages ────────────────────────────────────────────────────
 const _searchErrMsg = ['Terjadi kesalahan saat mencari.','Pencarian gagal, coba lagi.','Terjadi gangguan saat pencarian.','Gagal memuat hasil pencarian.','Error saat mencari, coba lagi.','Pencarian tidak berhasil.','Gagal terhubung untuk mencari.','Pencarian error, refresh dan coba.','Tidak bisa memuat hasil.','Coba pencarian ulang.'];
 const _serviceErrMsg = ['Layanan sementara tidak tersedia. Silakan coba beberapa saat lagi.','Server sedang sibuk. Silakan coba kembali sebentar.','Layanan sedang dalam pemeliharaan. Coba lagi nanti.','Koneksi ke server gagal. Silakan refresh halaman.','Layanan tidak merespons. Coba lagi dalam beberapa detik.','Server timeout. Refresh halaman untuk melanjutkan.','Gangguan koneksi. Coba beberapa saat lagi.','Backend tidak tersedia sementara.','Permintaan gagal. Silakan coba ulang.','Terjadi error server. Refresh dan coba lagi.'];
 this.searchErrMsg = _searchErrMsg[hashSeed(this.domain+":searchErrMsg") % _searchErrMsg.length];
 this.serviceErrMsg = _serviceErrMsg[hashSeed(this.domain+":serviceErrMsg") % _serviceErrMsg.length];

 // ── handleStaticPage — faqData variasi ───────────────────────────────
 const _faqQ1 = ['Apakah gratis?','Apakah layanan ini gratis?','Gratis tidak?','Ada biaya tidak?','Perlu bayar tidak?','Gratis atau berbayar?','Apakah ada biaya?','Ini gratis?','Bayar tidak?','Berbayar kah?'];
 const _faqA1 = ['Ya, sepenuhnya gratis tanpa daftar.','Ya, 100% gratis tanpa perlu registrasi.','Gratis sepenuhnya, tidak perlu daftar.','Ya, tidak ada biaya apapun.','Benar, gratis total tanpa syarat.','Ya! Gratis selamanya.','Tidak ada biaya, 100% gratis.','Gratis, tidak perlu membayar.','Ya, tidak perlu kartu kredit.','Tentu, sepenuhnya gratis.'];
 const _faqQ2 = ['Cara melaporkan konten?','Bagaimana cara lapor konten?','Cara lapor konten bermasalah?','Prosedur laporan konten?','Bagaimana cara adukan konten?','Cara report konten ilegal?','Cara lapor DMCA?','Bagaimana melaporkan pelanggaran?','Cara komplain konten?','Prosedur takedown konten?'];
 const _faqQ3 = ['Apakah perlu registrasi?','Perlu daftar akun?','Harus registrasi dulu?','Wajib buat akun?','Perlu buat profil?','Harus login dulu?','Wajib signup?','Perlu mendaftar?','Harus punya akun?','Wajib registrasi?'];
 const _faqA3 = ['Tidak, Anda bisa langsung menonton tanpa mendaftar.','Tidak perlu, langsung bisa ditonton tanpa akun.','Tidak perlu registrasi sama sekali.','Tidak, langsung tonton tanpa daftar.','Tidak wajib, langsung akses tanpa login.','Tidak perlu akun sama sekali.','Bisa langsung tonton tanpa daftar.','Tidak, cukup buka dan tonton.','Tidak perlu signup, langsung tonton.','Tidak perlu akun, akses langsung.'];
 this.faqQ1 = _faqQ1[hashSeed(this.domain+":faqQ1") % _faqQ1.length];
 this.faqA1 = _faqA1[hashSeed(this.domain+":faqA1") % _faqA1.length];
 this.faqQ2 = _faqQ2[hashSeed(this.domain+":faqQ2") % _faqQ2.length];
 this.faqQ3 = _faqQ3[hashSeed(this.domain+":faqQ3") % _faqQ3.length];
 this.faqA3 = _faqA3[hashSeed(this.domain+":faqA3") % _faqA3.length];

 // ── amplifyIntent — relatedStrip label ───────────────────────────────
 const _relatedStripLabel = [
 'Pencarian terkait:',
 'Cari juga:',
 'Keyword terkait:',
 'Topik serupa:',
 'Eksplorasi lebih:',
 'Jelajahi juga:',
 'Lihat juga:',
 'Terkait dengan:',
 'Baca juga:',
 'Coba juga:',
 ];
 this.relatedStripLabel = _relatedStripLabel[hashSeed(this.domain+":relatedStripLabel") % _relatedStripLabel.length];

 // ── commercial intent label (untuk widget banner) ─────────────────────
 const _labelCommercial = ['Pilihan Terbaik','Rating Tertinggi','Terpopuler','Most Viewed','Top Rated','Paling Disukai','Favorit','Unggulan','Best Pick','Populer'];
 this.labelCommercial = _labelCommercial[hashSeed(this.domain+":labelCommercial") % _labelCommercial.length];

 // ── handleHome — section title "— Hal. X" suffix format ───────────────
 // Sudah di sectionPageLbl di atas — tambah versi panjang untuk h2
 const _sectionPageLblLong = [
 (pg) => `— Halaman ${pg}`,
 (pg) => `· Hal. ${pg}`,
 (pg) => `(Hal. ${pg})`,
 (pg) => `/ ${pg}`,
 ];
 this.sectionPageLblLongFn = _sectionPageLblLong[hashSeed(this.domain+":sectionPageLblLongFn") % _sectionPageLblLong.length];

 // ── handleSearch — pageTitle variasi ─────────────────────────────────
 const _searchPageTitleFn = [
 (q,pg,n) => q ? `Cari "${mbSubstr(q,0,50)}"${pg>1?' - Hal. '+pg:''} | ${n}` : `Pencarian | ${n}`,
 (q,pg,n) => q ? `Hasil "${mbSubstr(q,0,50)}"${pg>1?' · Hal. '+pg:''} — ${n}` : `Cari Konten | ${n}`,
 (q,pg,n) => q ? `"${mbSubstr(q,0,50)}" di ${n}${pg>1?' (Hal. '+pg+')':''}` : `Temukan Konten | ${n}`,
 (q,pg,n) => q ? `${n} — Cari: "${mbSubstr(q,0,40)}"${pg>1?' Hal. '+pg:''}` : `Search | ${n}`,
 ];
 const _searchPageDescFn = [
 (q,tot,n) => q ? `Hasil pencarian untuk "${q}" — ${numberFormat(tot)} konten di ${n}.` : `Cari video dan album di sini.`,
 (q,tot,n) => q ? `${numberFormat(tot)} konten ditemukan untuk "${q}" di ${n}.` : `Temukan konten favoritmu di ${n}.`,
 (q,tot,n) => q ? `${n}: ${numberFormat(tot)} hasil untuk "${q}".` : `Pencarian konten di ${n}.`,
 ];
 this.searchPageTitleFn = _searchPageTitleFn[hashSeed(this.domain+":searchPageTitleFn") % _searchPageTitleFn.length];
 this.searchPageDescFn = _searchPageDescFn[hashSeed(this.domain+":searchPageDescFn") % _searchPageDescFn.length];

 // ── handleCategory — pageTitle variasi ───────────────────────────────
 const _catPageTitleFn = [
 (lbl,pg,n) => `${lbl}${pg>1?' — Halaman '+pg:''} | ${n}`,
 (lbl,pg,n) => `${lbl}${pg>1?' · Hal. '+pg:''} — ${n}`,
 (lbl,pg,n) => `${n} ${lbl}${pg>1?' (Hal. '+pg+')':''}`,
 (lbl,pg,n) => `Koleksi ${lbl}${pg>1?' Hal. '+pg:''} | ${n}`,
 ];
 this.catPageTitleFn = _catPageTitleFn[hashSeed(this.domain+":catPageTitleFn") % _catPageTitleFn.length];

 // ── handleTag — pageTitle variasi ─────────────────────────────────────
 const _tagPageTitleFn = [
 (tag,pg,n) => `#${tag}${pg>1?' — Hal. '+pg:''} | ${n}`,
 (tag,pg,n) => `${tag}${pg>1?' · Hal. '+pg:''} — ${n}`,
 (tag,pg,n) => `${n}: ${tag}${pg>1?' (Hal. '+pg+')':''}`,
 (tag,pg,n) => `Konten ${tag}${pg>1?' Hal. '+pg:''} | ${n}`,
 ];
 this.tagPageTitleFn = _tagPageTitleFn[hashSeed(this.domain+":tagPageTitleFn") % _tagPageTitleFn.length];

 this._buildClassMap();
 } // end _build()

 _buildClassMap() {
 const d = this.domain;
 const c = (n) => clsHash(d, n);
 const i = (n) => idHash(d, n);
 this.cls = {

 header: c('header'),
 headerCont: c('header-container'),
 footer: c('footer'),
 footerGrid: c('footer-grid'),
 footerCol: c('footer-col'),
 footerCopy: c('footer-copy'),

 categories: c('categories'),
 catInner: c('categories-inner'),
 cat: c('cat'),
 catActive: c('cat-active'),
 bottomNav: c('bottom-nav'),
 bnItem: c('bn-item'),
 bnIconWrap: c('bn-icon-wrap'),
 bnDot: c('dot'),

 modalOverlay: c('modal-overlay'),
 modalInner: c('modal-inner'),
 modalHead: c('modal-head'),
 modalClose: c('modal-close'),
 modalNav: c('modal-nav'),

 logo: c('logo'),
 searchBar: c('search-bar'),
 menuBtn: c('menu-btn'),

 container: c('container'),
 layoutMain: c('layout-main'),
 contentGrid: c('content-grid'),
 contentArea: c('content-area'),
 vGrid: c('v-grid'),

 vCard: c('v-card'),
 vImg: c('v-img'),
 vInfo: c('v-info'),
 vTitle: c('v-title'),
 vMeta: c('v-meta'),

 trendingStrip: c('trending-strip'),
 trendingInner: c('trending-inner'),
 tCard: c('t-card'),
 tImg: c('t-img'),
 tInfo: c('t-info'),
 tTitle: c('t-title'),
 tNum: c('t-num'),
 tDur: c('t-dur'),

 badgeHot: c('badge-hot'),
 badgeQual: c('badge-qual'),
 badgeDur: c('badge-dur'),

 breadcrumb: c('breadcrumb'),
 bcSep: c('bc-sep'),
 tag: c('tag'),
 tags: c('tags'),
 tagCloud: c('tag-cloud'),
 pagination: c('pagination'),
 pg: c('pg'),
 pgActive: c('pg-active'),
 pgWide: c('pg-wide'),
 pageEllipsis: c('page-ellipsis'),
 pageNumbers: c('page-numbers'),
 pageBtn: c('page-btn'),
 promoBar: c('promo-banner'),
 loadMore: c('load-more-btn'),
 secHeader: c('sec-header'),
 secTitle: c('sec-title'),
 secCount: c('sec-count'),
 sectionHeader: c('section-header'),
 sectionTitle: c('section-title'),
 sectionCount: c('section-count'),
 pageHeader: c('page-header'),
 pageTitle: c('page-title'),
 pageDesc: c('page-desc'),
 noResults: c('no-results'),
 skeletonCard: c('skeleton-card'),
 skeletonLine: c('skeleton-line'),
 viewMain: c('view-main'),
 viewLayout: c('view-layout'),
 categoryStrip: c('category-strip'),
 catStripInner: c('category-strip-inner'),
 errorPage: c('error-page'),
 errorContent: c('error-content'),
 };
 this.ids = {
 mainContent: i('main-content'),
 modalMenu: i('modal-menu'),
 menuBtn: i('menu-btn'),
 closeModal: i('close-modal'),
 searchInput: i('search-input'),
 searchBtn: i('search-btn'),
 catList: i('cat-list'),
 backToTop: i('back-to-top'),
 };
 }

 static get(domain) {
 let dna = _siteDNACache.get(domain);
 if (!dna) { dna = new SiteDNA(domain); _siteDNACache.set(domain, dna); }
 return dna;
 }
}

function microVar(domain, contentId) {
 const s1 = hashSeed(domain + ':' + contentId + ':mv1');
 const s2 = hashSeed(domain + ':' + contentId + ':mv2');
 const s3 = hashSeed(String(contentId) + domain.slice(0, 3) + ':mv3');
 const qual = ['HD','FHD','4K','720p','1080p','HDR','2K','UHD','HQ','BluRay','8K','SD','1080i','480p','360p'][s1 % 15];
 const stat = ['Gratis','Free','Online','Full','Terbaru','Update','Stream','Baru','Legal','Fast','Clear','Best'][s2 % 12];
 const sep = [' · ', ' | ', ' — ', ' / '][(s1 + s2) % 4];
 const bonus = (s3 % 3 === 0) ? (' ' + ['v' + ((s3 % 9) + 1), 'ep' + ((s3 % 12) + 1), '#' + ((s3 % 20) + 1)][s3 % 3]) : '';
 return sep + qual + (s3 % 2 === 0 ? '' : (' ' + stat)) + bonus;
}

function bumbuItem(item, domain, sinonimOverride=null) {
 if (!item || !item.id) return item;
 // Guard: jangan bumbu ulang item yang sudah di-bumbu di domain yang sama
 // _original_title ada = sudah di-bumbu, early return
 if (item._original_title !== undefined) return item;

 item = Object.assign(Object.create(null), item);
 const dna = SiteDNA.get(domain);
 const s = hashSeed(domain + ':' + item.id);
 const sDesc = hashSeed(domain + ':' + item.id + ':desc');
 const sTag = hashSeed(domain + ':' + item.id + ':tag');
 const isAlbum = item.type === 'album';

 if (item.title) {
 const tpls = isAlbum ? dna.albumTpls : dna.videoTpls;
 item._original_title = item._original_title || item.title;

 const tpl = tpls[s % tpls.length];
 const base = tpl
 .replace('{v}', dna.verbNonton)
 .replace('{t}', item._original_title);
 item.title = base + microVar(domain, item.id);
 }

 const baseTitle = item._original_title || item.title || '';
 const prefix = dna.descPrefixes[sDesc % dna.descPrefixes.length].replace('{t}', baseTitle);
 const suffix = dna.descSuffixes[(sDesc + 3) % dna.descSuffixes.length];
 const origDesc = item._original_description !== undefined ? item._original_description : (item.description || '');
 item._original_description = origDesc;

 const trimmed = origDesc ? rewriteDesc(truncate(origDesc, 120), sDesc, sinonimOverride) + ' ' : '';
 item.description = `${prefix} ${trimmed}${suffix}`;

 item.quality_label = dna.qualityPool[s % dna.qualityPool.length];

 if (Array.isArray(item.tags)) {
 const extra = dna.tagPools[sTag % dna.tagPools.length];
 item.tags = [...new Set([...item.tags, ...extra])].slice(0, 15);
 }

 // 🧠 HDC: kitab cacah item ke SemanticIndex — pakai _original_title biar vektor bersih
 SemanticIndex.index(item, domain);

 return item;
}

function bumbuItems(items, domain, sinonimOverride=null) {
 if (!Array.isArray(items)) return;
 for (let i = 0; i < items.length; i++) {
 items[i] = bumbuItem(items[i], domain, sinonimOverride);
 if (items[i].photos && Array.isArray(items[i].photos)) {
 for (let j = 0; j < items[i].photos.length; j++) {
 items[i].photos[j] = bumbuItem(items[i].photos[j], domain, sinonimOverride);
 }
 }
 }
}

class SeoHelper {
 constructor(cfg) {
 this.siteName = cfg.WARUNG_NAME;
 this.domain = cfg.WARUNG_DOMAIN;
 this.domainSeed = hashSeed(cfg.WARUNG_DOMAIN);
 this.cfg = cfg;

 const s = this.domainSeed;
 const n = this.siteName;

 const dna = SiteDNA.get(this.domain);
 const _sv = dna.verbNonton;
 const _sq = ['HD','FHD','4K','1080p','Ultra HD'][s%5];
 const _sq2= ['Gratis','Free','Cuma-Cuma'][(s+1)%3];
 const _sa = ['Tanpa Daftar','No Register','Langsung'][(s+2)%3];
 const _sc = ['Terbaru','Update','Baru'][(s+3)%3];
 const _se = ['Terpercaya','Terbaik','Unggulan'][(s+4)%3];

 this.titleTemplates = seededShuffle([
 `{title} ${_sq} - ${n}`,
 `{title} | ${n} · ${_sq2}`,
 `${_sv} {title} di ${n}`,
 `{title} ${_sq} | ${n} · ${_sa}`,
 `Streaming {title} - ${n} · ${_sq}`,
 `${n} | {title} · ${_sv}`,
 `{title} ${_sq2} - ${n} · ${_sq}`,
 `${_sv} {title} Online | ${n}`,
 `{title} ${_sc} - ${n} · ${_sq}`,
 `${n} ${_se}: {title}`,
 `{title} · ${_sq} · ${_sq2} | ${n}`,
 `${n} · ${_sv} {title} ${_sq}`,
 `{title} | ${_sa} · ${_sq} - ${n}`,
 `${_sv} {title} ${_sq2} | ${n}`,
 `{title} ${_sc} ${_sq} - ${n}`,
 `${n} | {title} · ${_sq} · ${_sq2}`,
 `{title} ${_se} - ${n} · ${_sv}`,
 `{title} · ${_sa} | ${n} ${_sq}`,
 `${n} ${_sq}: {title} · ${_sq2}`,
 `${_sv} {title} | ${n} · ${_sc}`,
 `{title} · ${_sv} · ${_sq} | ${n}`,
 `${n} — {title} ${_sq} ${_sq2}`,
 `{title} ${_se} ${_sq} | ${n}`,
 `${_sv} {title} ${_sc} - ${n} ${_sq}`,
 ], this.domainSeed);

 this.descTemplates = seededShuffle([

 `{title} tersedia gratis di ${n}. Streaming langsung tanpa registrasi.`,
 `Tonton {title} kualitas HD di ${n}. Gratis, cepat, tanpa buffering.`,
 `${n} menghadirkan {title}. Akses unlimited, 100% gratis.`,
 `Nikmati {title} di ${n}. Platform streaming terpercaya.`,
 `{title} kini hadir di ${n}. Nonton gratis tanpa iklan.`,
 `Streaming {title} HD di ${n}. Tanpa registrasi, langsung tonton.`,
 `Cari {title}? ${n} tempatnya. Gratis dan berkualitas.`,
 `{title} — tersedia di ${n}. Kualitas HD, gratis selamanya.`,
 `${n} hadirkan {title} untuk Anda. Tonton kapan saja, di mana saja.`,
 `Ingin tonton {title}? ${n} menyediakan gratis tanpa daftar.`,

 `{title} sudah ditonton {views}di ${n}. Bergabung dan nikmati gratis.`,
 `${n}: tempat terbaik ${['nonton','tonton','streaming'][(s+1)%3]} {title}. Gratis & HD.`,
 `{title} kini bisa disaksikan di ${n}. Update harian, kualitas terjamin.`,
 `Akses {title} di ${n} — tanpa iklan, tanpa buffering, tanpa biaya.`,
 `${n} mengupdate {title} setiap hari. ${['Tonton','Nikmati','Saksikan'][(s+2)%3]} sekarang.`,

 `Gratis dan tanpa daftar — ${['nonton','tonton','akses'][(s+3)%3]} {title} di ${n} sekarang.`,
 `{title} resolusi ${['HD','Full HD','4K'][(s+4)%3]} tersedia gratis di ${n}.`,
 `Ribuan penonton sudah ${['menikmati','menonton','menyaksikan'][(s+5)%3]} {title} di ${n}.`,
 `{title} — konten pilihan di ${n}. Tidak perlu registrasi, langsung tonton.`,
 `${n} | {title} tersedia dalam kualitas ${['HD','FHD','4K'][(s+6)%3]} tanpa biaya apapun.`,
 ], this.domainSeed + 1);

 this.schemaTypeMap = { video:'VideoObject', album:'ImageGallery' };
 this.hiddenTokens = ['premium','exclusive','ultra-hd','no-ads','fast-stream','4k-quality','hd-ready','instant-play','zero-buffer','high-speed'];
 }

 generateUniqueSchema(id, type='video') {
 const seed = hashSeed(this.domain+id+type+this.domainSeed);
 return {
 schema_type: this.schemaTypeMap[type]||'CreativeWork',
 token: this.hiddenTokens[seed%this.hiddenTokens.length],
 interaction_type: (type==='video'?'WatchAction':'ViewAction'),
 comment: `<!-- ${this.domain} -->`,
 seed, hash: hexHash(seed+this.domain, 32),
 };
 }

 title(baseTitle, contentId=0, type='') {
 baseTitle=(baseTitle||'').trim(); if (!baseTitle) return this.siteName;

 const contentSeed = contentId>0 ? (contentId*2654435761) : hashSeed(baseTitle);
 const idx = Math.abs((this.domainSeed ^ contentSeed ^ hashSeed(type||'v')) % this.titleTemplates.length);
 const out = this.titleTemplates[idx]
 .replace('{title}', baseTitle)
 .replace('{site}', this.siteName)
 .replace('{type}', type||'konten');
 // FIX: turunkan max title length — Google truncate di ~60 char di SERP
 return mbSubstr(out, 0, [55,57,58,60,60][this.domainSeed%5]);
 }

 description(baseTitle, contentId=0, type='', views=0) {
 baseTitle=(baseTitle||'').trim(); if (!baseTitle) return this.cfg.SEO_DEFAULT_DESC;

 const contentSeed = contentId>0 ? (contentId*1234567891) : hashSeed(baseTitle);
 const idx = Math.abs((this.domainSeed ^ contentSeed ^ hashSeed(type||'v') ^ 0xdeadbeef) % this.descTemplates.length);
 const viewsStr = views>0 ? formatViews(views)+'x ditonton. ' : '';
 const out = this.descTemplates[idx]
 .replace('{title}', baseTitle)
 .replace('{site}', this.siteName)
 .replace('{type}', type||'konten')
 .replace('{views}', viewsStr);
 return mbSubstr(out, 0, [150,155,160,165,170][this.domainSeed%5]);
 }

 canonical(path='', request=null) {
 if (!path&&request) path=new URL(request.url).pathname;
 path=path.replace(/[^\w\-\/\.?=&#@!,:+~%]/g,'');
 return 'https://'+this.domain+(path||'/');
 }

 renderMeta({ title, desc, canonical, ogImage, ogType='website', keywords, noindex=false,
 contentId=0, contentType='meta', publishedTime='', modifiedTime='',
 twitterCard='', isPagePaginated=false, nonce='' }) {
 // Fallback: jika desc kosong/undefined, pakai SEO_DEFAULT_DESC lalu siteName
 desc = (desc||'').trim() || this.cfg.SEO_DEFAULT_DESC || (this.siteName + ' — streaming gratis, tanpa registrasi.');
 title = (title||'').trim() || this.siteName;
 const fp = this.generateUniqueSchema(contentId, contentType);
 const robotsBase = noindex ? 'noindex, nofollow'
 : isPagePaginated ? 'index, follow, max-snippet:-1, max-image-preview:large'
 : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';
 const finalImg = ogImage||this.cfg.SEO_OG_IMAGE;
 const card = twitterCard||(finalImg?'summary_large_image':'summary');
 const locale = this.cfg.SEO_LOCALE||'id_ID';
 const twitterSite = this.cfg.SEO_TWITTER_SITE ? `\n<meta name="twitter:site" content="${h(this.cfg.SEO_TWITTER_SITE)}">` : '';
 let articleMeta='', videoMeta='';
 if (ogType==='article'||ogType==='video.movie') {
 if (publishedTime) articleMeta+=`\n<meta property="article:published_time" content="${h(publishedTime)}">`;
 if (modifiedTime) articleMeta+=`\n<meta property="article:modified_time" content="${h(modifiedTime)}">`;
 articleMeta+=`\n<meta property="article:author" content="https://${h(this.domain)}">`;
 articleMeta+=`\n<meta property="article:publisher" content="https://${h(this.domain)}">`;
 if (contentType) articleMeta+=`\n<meta property="article:section" content="${h(contentType==='video'?'Video':contentType==='album'?'Album':'Hiburan')}">`;
 // article:tag per keyword — max 5, bantu Facebook & OG crawlers
 if (keywords) {
 keywords.split(',').slice(0,5).forEach(tag=>{
 const t=tag.trim(); if(t) articleMeta+=`\n<meta property="article:tag" content="${h(t)}">`;
 });
 }
 }
 if (ogType==='video.movie') {
 videoMeta=`\n<meta property="og:video" content="${h(canonical)}">\n<meta property="og:video:secure_url" content="${h(canonical)}">\n<meta property="og:video:type" content="text/html">\n<meta property="og:video:width" content="1280">\n<meta property="og:video:height" content="720">`;
 if (publishedTime) videoMeta+=`\n<meta property="og:video:release_date" content="${h(publishedTime)}">`;
 }
 return `${fp.comment}
<title>${h(title)}</title>
<meta name="description" content="${h(desc)}">
<meta name="keywords" content="${h(keywords||this.cfg.SEO_KEYWORDS)}">
<meta name="robots" content="${robotsBase}">
<meta name="googlebot" content="${robotsBase}">
<meta name="author" content="${h(this.siteName)}">
<meta name="rating" content="general">
<meta name="HandheldFriendly" content="True">
<link rel="canonical" href="${h(canonical)}">
${(() => {
 const lang = this.cfg.SEO_LOCALE || (this.cfg.SEO_LANG === 'id' ? 'id-ID' : this.cfg.SEO_LANG) || 'id-ID';
 // hreflang WAJIB pakai BCP 47 dengan hyphen (id-ID), bukan underscore (id_ID)
 const hreflangLang = lang.replace('_', '-');
 const regions = this.cfg.SEO_HREFLANG_REGIONS || '';
 const lines = [`<link rel="alternate" hreflang="${h(hreflangLang)}" href="${h(canonical)}">`];
 // Parse regions: "ms:situs.my,en:situs.sg"
 if (regions) {
 const canonicalHostname = (() => { try { return new URL(canonical).hostname; } catch { return ''; } })();
 regions.split(',').map(r => r.trim()).filter(r => r.includes(':')).forEach(r => {
 const [rlang, rdomain] = r.split(':').map(s => s.trim());
 if (rlang && rdomain) {
 // Skip jika lang sama dengan lang utama (duplikat hreflang)
 // Skip jika domain sama dengan canonical (duplikat URL)
 if (rlang === hreflangLang || rdomain === canonicalHostname) return;
 // Ganti domain di canonical URL dengan domain region
 try {
 const u = new URL(canonical);
 u.hostname = rdomain;
 // Normalize region lang juga ke BCP 47 hyphen
 lines.push(`<link rel="alternate" hreflang="${h(rlang.replace('_','-'))}" href="${h(u.toString())}">`);
 } catch {}
 }
 });
 }
 lines.push(`<link rel="alternate" hreflang="x-default" href="${h(canonical)}">`);
 return lines.join('\n');
})()}
<meta property="og:title" content="${h(title)}">
<meta property="og:description" content="${h(desc)}">
<meta property="og:url" content="${h(canonical)}">
<meta property="og:image" content="${h(finalImg)}">
<meta property="og:image:secure_url" content="${h(finalImg)}">
<meta property="og:image:type" content="${/\.avif(\?|$)/i.test(finalImg)?'image/avif':/\.webp(\?|$)/i.test(finalImg)?'image/webp':/\.png(\?|$)/i.test(finalImg)?'image/png':'image/jpeg'}">
<meta property="og:image:width" content="${(ogType==='video.movie'||ogType==='article')&&ogImage&&ogImage!==this.cfg.SEO_OG_IMAGE?'1280':this.cfg.SEO_OG_IMAGE_W||1200}">
<meta property="og:image:height" content="${(ogType==='video.movie'||ogType==='article')&&ogImage&&ogImage!==this.cfg.SEO_OG_IMAGE?'720':this.cfg.SEO_OG_IMAGE_H||630}">
<meta property="og:image:alt" content="${h(title)}">
<meta property="og:type" content="${h(ogType)}">
<meta property="og:site_name" content="${h(this.siteName)}">
<meta property="og:locale" content="${h(locale)}">
<meta name="twitter:card" content="${card}">
<meta name="twitter:title" content="${h(title)}">
<meta name="twitter:description" content="${h(desc)}">
<meta name="twitter:image" content="${h(finalImg)}">
<meta name="twitter:image:alt" content="${h(title)}">${twitterSite}${articleMeta}${videoMeta}`;
 }

 contentSchema(item, canonical, playerUrl=null) {
 if (!item) return '';
 const fp=this.generateUniqueSchema(item.id||0, item.type);
 const type=item.type||'video';
 const baseId='https://'+this.domain+'/#'+type+'-'+(item.id||0);
 const pub={ '@type':'Organization', '@id':'https://'+this.domain+'/#organization', 'name':this.siteName, 'url':'https://'+this.domain, 'logo':{'@type':'ImageObject','url':this.cfg.SEO_OG_IMAGE||('https://'+this.domain+'/assets/og-default.jpg'),'width':this.cfg.SEO_OG_IMAGE_W||1200,'height':this.cfg.SEO_OG_IMAGE_H||630} };
 const _dnaSchema = SiteDNA.get(this.domain);
 const _sDescSeed = hashSeed(this.domain + ':sdesc:' + (item.id || 0));
 const _sDescPre = _dnaSchema.descPrefixes[_sDescSeed % _dnaSchema.descPrefixes.length].replace('{t}', item.title || '');
 const _sDescSuf = _dnaSchema.descSuffixes[(_sDescSeed + 2) % _dnaSchema.descSuffixes.length];
 const _schemaDesc = _dnaSchema.schemaDescTpl(item.description || item.title || '', _sDescPre, _sDescSuf);
 const base={
 '@type':fp.schema_type,'@id':baseId,'name':item.title||'',
 'description': truncate(_schemaDesc, 300),
 'url':canonical,'publisher':pub,'isFamilyFriendly':true,'isAccessibleForFree':true,
 ...(item.tags?.length?{'keywords':item.tags.slice(0,10).join(', ')}:{}),
 'interactionStatistic':{'@type':'InteractionCounter','interactionType':{'@type':fp.interaction_type},'userInteractionCount':parseInt(item.views||0, 10)},
 };
 if (item.thumbnail) { const _t=_absUrl(item.thumbnail,this.domain); base['thumbnail']={'@type':'ImageObject','url':_t}; base['image']=_t; }
 if (type==='video') {
 const thumb=_absUrl(item.thumbnail||('https://'+this.domain+'/assets/og-default.jpg'), this.domain);
 // Fix: uploadDate pakai ensureTz agar ada timezone (WIB +07:00)
 // Fix: contentUrl dihapus — video di hosting pihak ketiga, tidak ada direct file URL
 // Fix: embedUrl hanya diisi jika playerUrl tersedia, jangan fallback ke canonical
 const _videoExtra={'thumbnailUrl':[thumb],'uploadDate':ensureTz(item.created_at)||new Date().toISOString(),'regionsAllowed':'ID','requiresSubscription':false,'inLanguage':this.cfg.SEO_LANG||'id','potentialAction':{'@type':'WatchAction','target':{'@type':'EntryPoint','urlTemplate':canonical}}};
 if (playerUrl) _videoExtra['embedUrl']=playerUrl;
 Object.assign(base,_videoExtra);
 if (item.duration) base['duration']=isoDuration(parseInt(item.duration, 10));
 if (item.created_at) base['datePublished']=item.created_at;
 if (item.updated_at) base['dateModified']=item.updated_at;
 } else if (type==='album') {
 Object.assign(base,{'datePublished':item.created_at||new Date().toISOString(),'dateModified':item.updated_at||item.created_at||new Date().toISOString(),'inLanguage':this.cfg.SEO_LANG||'id','numberOfItems':item.photo_count||0,'potentialAction':{'@type':'ViewAction','target':canonical}});
 }
 Object.keys(base).forEach(k=>(base[k]===undefined||base[k]===null)&&delete base[k]);
 return `<script type="application/ld+json" nonce="${generateNonce()}">${JSON.stringify({'@context':'https://schema.org','@graph':[base]},null,0)}</script>`;
 }

 websiteSchema(searchUrlTpl) {
 const orgId='https://'+this.domain+'/#organization';
 const siteId='https://'+this.domain+'/#website';
 const logoUrl = this.cfg.SEO_OG_IMAGE || ('https://'+this.domain+'/assets/og-default.jpg');
 const sameAs = ['https://'+this.domain];
 if (this.cfg.SEO_TWITTER_SITE) sameAs.push('https://twitter.com/'+this.cfg.SEO_TWITTER_SITE.replace(/^@/,''));
 const graph=[
 {'@type':'Organization','@id':orgId,'name':this.siteName,'url':'https://'+this.domain,'logo':{'@type':'ImageObject','@id':'https://'+this.domain+'/#logo','url':logoUrl,'width':this.cfg.SEO_OG_IMAGE_W||1200,'height':this.cfg.SEO_OG_IMAGE_H||630,'caption':this.siteName},'contactPoint':{'@type':'ContactPoint','email':this.cfg.CONTACT_EMAIL||'','contactType':'customer support'},'sameAs':sameAs},
 {'@type':'WebSite','@id':siteId,'name':this.siteName,'url':'https://'+this.domain,'description':this.cfg.SEO_DEFAULT_DESC,'inLanguage':this.cfg.SEO_LANG||'id','publisher':{'@id':orgId},
 'potentialAction':[
 {'@type':'SearchAction','target':{'@type':'EntryPoint','urlTemplate':searchUrlTpl},'query-input':'required name=search_term_string'},
 ]
 },
 ];
 return `<script type="application/ld+json" nonce="${generateNonce()}">${JSON.stringify({'@context':'https://schema.org','@graph':graph},null,0)}</script>`;
 }

 collectionPageSchema(keyword, items, canonical, cfg) {
 const schema = {
 '@context': 'https://schema.org',
 '@type': 'CollectionPage',
 '@id': canonical + '#collectionpage',
 'url': canonical,
 'name': keyword + ' - ' + cfg.WARUNG_NAME,
 'description': 'Koleksi ' + keyword + ' terlengkap di ' + cfg.WARUNG_NAME,
 'inLanguage': cfg.SEO_LANG || 'id',
 'publisher': { '@type': 'Organization', 'name': cfg.WARUNG_NAME, 'url': 'https://' + cfg.WARUNG_DOMAIN },
 'mainEntity': {
 '@type': 'ItemList',
 'name': keyword,
 'numberOfItems': items.length,
 'itemListElement': items.slice(0, Math.min(items.length, 24)).map((item, i) => ({
 '@type': 'ListItem',
 'position': i + 1,
 'url': 'https://' + cfg.WARUNG_DOMAIN + itemUrl(item, cfg),
 'name': item.title || '',
 'image': _absUrl(item.thumbnail || '', cfg.WARUNG_DOMAIN),
 })),
 },
 };
 return `<script type="application/ld+json" nonce="${generateNonce()}">${JSON.stringify(schema,null,0)}</script>`;
 }

 breadcrumbSchema(items, pageId='') {
 const bcrumbId = 'https://'+this.domain+(pageId||'/')+'#breadcrumb';
 const schema = { '@context':'https://schema.org', '@type':'BreadcrumbList', '@id':bcrumbId, 'itemListElement':items.map((item,i)=>{const el={'@type':'ListItem','position':i+1,'name':item.name};if(item.url) el['item']='https://'+this.domain+item.url; return el;}) };
 return `<script type="application/ld+json" nonce="${generateNonce()}">${JSON.stringify(schema,null,0)}</script>`;
 }

 itemListSchema(items, canonical, cfg) {
 if (!items?.length) return '';
 const schema={ '@context':'https://schema.org','@type':'ItemList','@id':canonical+'#itemlist','url':canonical,'name':cfg.WARUNG_NAME,'numberOfItems':items.length,'itemListElement':items.slice(0,Math.min(items.length,24)).map((item,i)=>({'@type':'ListItem','position':i+1,'url':'https://'+cfg.WARUNG_DOMAIN+itemUrl(item,cfg),'name':item.title||'','image':_absUrl(item.thumbnail||'', cfg?.WARUNG_DOMAIN||'')})) };
 return `<script type="application/ld+json" nonce="${generateNonce()}">${JSON.stringify(schema,null,0)}</script>`;
 }

 albumImageSchema(photos, item, canonical, cfg) {
  // FIX: ImageObject schema per foto album — bantu Google Images indexing
  if (!photos?.length) return '';
  const nonce = generateNonce();
  const domBase = 'https://' + this.domain;
  const imgs = photos.slice(0,50).map((photo,i) => {
   const url = photo?.url||photo?.src||''; if (!url) return null;
   return {'@type':'ImageObject','@id':url,'url':url,'contentUrl':url,
    'name':`${item.title||''} - Foto ${i+1}`,
    'description':item.description?truncate(item.description,120):(item.title||''),
    'representativeOfPage':i===0,'inLanguage':cfg.SEO_LANG||'id',
    'isPartOf':{'@type':'WebPage','@id':canonical,'url':canonical},
    'license':domBase+'/'+cfg.PATH_TERMS,
    'acquireLicensePage':domBase+'/'+cfg.PATH_CONTACT,
    ...(photo.width?{'width':{'@type':'QuantitativeValue','value':photo.width}}:{}),
    ...(photo.height?{'height':{'@type':'QuantitativeValue','value':photo.height}}:{}),
   };
  }).filter(Boolean);
  if (!imgs.length) return '';
  return `<script type="application/ld+json" nonce="${nonce}">${JSON.stringify({'@context':'https://schema.org','@type':'ImageGallery','@id':canonical+'#gallery','url':canonical,'name':item.title||'','image':imgs},null,0)}</script>`;
 }

 faqSchema(faqs) {
 if (!faqs?.length) return '';
 const schema={ '@context':'https://schema.org','@type':'FAQPage','mainEntity':faqs.map(faq=>({'@type':'Question','name':faq.q,'acceptedAnswer':{'@type':'Answer','text':faq.a}})) };
 return `<script type="application/ld+json" nonce="${generateNonce()}">${JSON.stringify(schema,null,0)}</script>`;
 }
}

/**
 * sanitizeAdCode — validasi kode iklan dari env var sebelum di-inject ke HTML.
 *
 * Layer keamanan:
 *  1. Tolak protocol berbahaya di atribut src/href/action (javascript:, data:, vbscript:)
 *  2. Whitelist domain untuk semua src/href https — hanya ad network yang dikenal
 *  3. Tolak inline event handler (on* attributes) di semua tag
 *  4. Validasi <script> inline — hanya AdProvider push pattern (magsrv) yang diizinkan
 *
 * Sumber kode iklan = env vars CF (dikontrol owner domain).
 * Sanitasi ini sebagai defense-in-depth kalau env var dikompromis.
 */
function sanitizeAdCode(code) {
 if (!code) return '';

 const _ALLOWED_AD_DOMAINS = [
  'a.magsrv.com', 'js.juicyads.com', 'www.juicyads.rocks',
  'exoclick.com', 'www.exoclick.com', 'js.exoclick.com',
  'static.exoclick.com', 'syndication.exdynsrv.com', 'ad.juicyads.com',
 ];

 // 1. Tolak protocol berbahaya di atribut
 if (/(?:src|href|action)\s*=\s*["']?\s*(?:javascript|data|vbscript)\s*:/i.test(code)) return '';

 // 2. Whitelist domain untuk src/href https
 for (const m of code.matchAll(/(?:src|href)\s*=\s*["'](https?:\/\/[^"']+)["']/gi)) {
  try {
   const host = new URL(m[1]).hostname.toLowerCase();
   if (!_ALLOWED_AD_DOMAINS.some(d => host === d || host.endsWith('.' + d))) return '';
  } catch { return ''; }
 }

 // 3. Tolak inline event handler (on* di semua tag)
 if (/\bon\w+\s*=/i.test(code)) return '';

 // 4. Validasi <script> inline (tanpa src attribute)
 for (const m of code.matchAll(/<script(?![^>]*\bsrc\s*=)[^>]*>([\s\S]*?)<\/script>/gi)) {
  const content = m[1].trim();
  if (!content) continue;
  // Hanya AdProvider push pattern (magsrv) yang diizinkan
  const isAdProvider = /^\s*\(AdProvider\s*=[\s\S]*?\)\.push\(\{[\s\S]*?\}\);\s*$/.test(content);
  const isDangerous = /\b(?:eval|fetch|XMLHttpRequest|document\.|atob|btoa|innerHTML|outerHTML|localStorage|sessionStorage|window\.location|import\s*\()/i.test(content);
  if (!isAdProvider || isDangerous) return '';
 }

 return code;
}

function getAdsSlots(cfg) {
 const ck = cfg.WARUNG_DOMAIN+':'+cfg.ADS_ADSENSE_CLIENT+':'
 +(cfg.ADS_CODE_TOP_D||'').slice(0,32)+':'+(cfg.ADS_CODE_TOP_M||'').slice(0,32)+':'
 +(cfg.ADS_CODE_CNT_D||'').slice(0,32)+':'+(cfg.ADS_CODE_CNT_M||'').slice(0,32)+':'
 +(cfg.ADS_CODE_SDB_D||'').slice(0,32)+':'+(cfg.ADS_CODE_SDB_M||'').slice(0,32)+':'
 +(cfg.ADS_CODE_POPUNDER||'').slice(0,32)+':'+cfg.ADS_MID_GRID_AFTER;
 if (_adsSlotsCache.has(ck)) return _adsSlotsCache.get(ck);

 const tD = cfg.ADS_CODE_TOP_D, tM = cfg.ADS_CODE_TOP_M; // TOP → header_top — Iki tapaking jaman sing wis keliwat
 const cD = cfg.ADS_CODE_CNT_D, cM = cfg.ADS_CODE_CNT_M; // CNT → before_grid, mid_grid, after_grid — Petungan iki wis diuji sak jroning gara-gara
 const sD = cfg.ADS_CODE_SDB_D, sM = cfg.ADS_CODE_SDB_M; // SDB → sidebar_top, sidebar_mid, sidebar_bottom

 const pU = cfg.ADS_CODE_POPUNDER || cM || cD;

 const slots = {
 header_top: { enabled:true, type:'html', code_desktop:tD, code_mobile:tM, label:true, align:'center', margin:'0 0 4px' },
 before_grid: { enabled:true, type:'html', code_desktop:cD, code_mobile:cM, label:'', align:'center', margin:'8px 0 16px' },
 mid_grid: { enabled:true, type:'html', code_desktop:cD, code_mobile:cM, label:'', align:'center', margin:'4px 0', insert_after:safeParseInt(cfg.ADS_MID_GRID_AFTER,6) },
 after_grid: { enabled:true, type:'html', code_desktop:cD, code_mobile:cM, label:true, align:'center', margin:'16px 0 8px' },
 sidebar_top: { enabled:true, type:'html', code_desktop:sD, code_mobile:sM, label:true, align:'center', margin:'0 0 16px' },
 sidebar_mid: { enabled:true, type:'html', code_desktop:sD, code_mobile:sM, label:true, align:'center', margin:'0 0 16px' },
 sidebar_bottom: { enabled:true, type:'html', code_desktop:sD, code_mobile:sM, label:true, align:'center', margin:'0' },
 after_content: { enabled:true, type:'html', code_desktop:cD, code_mobile:cM, label:false, align:'center', margin:'24px 0' },
 footer_top: { enabled:true, type:'html', code_desktop:'', code_mobile:'', label:false, align:'center', margin:'0' },
 footer_popunder: { enabled:true, type:'popunder', code_desktop:pU, code_mobile:pU, label:false, align:'center', margin:'0' },
 };
 _adsSlotsCache.set(ck, slots);
 return slots;
}

function getDeliveryMode(request) {
 const ect=request.headers.get('ECT')||'';
 const downlink=parseFloat(request.headers.get('downlink')||'NaN');
 const saveData=request.headers.get('Save-Data')==='on';
 const ua=request.headers.get('User-Agent')||'';
 const cfDev=request.headers.get('CF-Device-Type')||'';
 const slowNet=(ect==='slow-2g'||ect==='2g')||(!isNaN(downlink)&&downlink<0.5);
 return { lite:slowNet||saveData, saveData, mobile:cfDev==='mobile'||_MOBILE_UA_RX.test(ua), lowEnd:slowNet };
}

function renderBanner(name, cfg, request=null, nonce='') {
 if (!cfg.ADS_ENABLED) return '';
 const slots=getAdsSlots(cfg); const slot=slots[name];
 if (!slot||!slot.enabled) return '';
 const margin=h(slot.margin||'16px 0');
 const align=slot.align==='left'?'left':slot.align==='right'?'right':'center';
 const labelHtml = '';

 const injectNonce = (code) => {
 if (!code||!nonce) return sanitizeAdCode(code);
 return sanitizeAdCode(code).replace(/<script\b([^>]*)>/gi, (m, attrs) => {
 if (attrs.includes('nonce=')) return m;
 return `<script${attrs} nonce="${nonce}">`;
 });
 };
 if (slot.type==='popunder') {

 const code = injectNonce(slot.code_mobile || slot.code_desktop || '');
 if (!code) return '';
 return `<div class="ad-slot ad-slot--footer_popunder" aria-hidden="true">${code}</div>`;
 }
 if (slot.type==='html' && (slot.code_desktop || slot.code_mobile)) {
 // jalur kabur menyang latar wingit: kalau salah satu kosong, gunakan yang tersedia untuk keduanya
 const codeD = slot.code_desktop || slot.code_mobile;
 const codeM = slot.code_mobile || slot.code_desktop;
 if (request) {
 const isMob=getDeliveryMode(request).mobile;
 const code=injectNonce(isMob ? codeM : codeD);
 const cls=isMob?'ads-mobile':'ads-desktop';
 return `<div class="ad-slot ad-slot--${h(name)} ${cls}" style="margin:${margin};text-align:${align}">${labelHtml}${code}</div>`;
 }
 return [
 `<div class="ad-slot ad-slot--${h(name)} ads-desktop" style="margin:${margin};text-align:${align}">${labelHtml}${injectNonce(codeD)}</div>`,
 `<div class="ad-slot ad-slot--${h(name)} ads-mobile" style="margin:${margin};text-align:${align}">${labelHtml}${injectNonce(codeM)}</div>`,
 ].join('\n');
 }
 return '';
}

function renderBannerMidGrid(index, cfg, request=null, nonce='') {
 if (!cfg.ADS_ENABLED) return '';
 const slot=getAdsSlots(cfg)['mid_grid'];
 if (!slot||!slot.enabled) return '';

 return renderBanner('mid_grid', cfg, request, nonce);
}

function bannerStyles() {
 return `<style>

.ad-slot{overflow:visible;width:100%;max-width:100%;box-sizing:border-box;min-height:1px;display:block}

.ads-desktop{display:block!important}.ads-mobile{display:none!important}
@media(max-width:767px){
 .ads-desktop{display:none!important}
 .ads-mobile{display:block!important}
}

.ad-slot--header_top{min-height:90px;contain:layout style}
.ad-slot--before_grid,.ad-slot--after_grid{min-height:100px;contain:layout style}
.ad-slot--mid_grid{min-height:100px;contain:layout style}
.ad-slot--sidebar_top,.ad-slot--sidebar_mid{min-height:250px;contain:layout style}
.ad-slot--footer_top{min-height:90px;contain:layout style}

.content-grid>li>.ad-slot--mid_grid,.content-grid>.ad-slot--mid_grid{grid-column:1/-1;width:100%}

@media(max-width:767px){
 /* min-height mobile realistis — cegah CLS saat iklan belum load */
 .ad-slot--header_top{
 min-height:50px;
 contain:layout style;
 }
 .ad-slot--before_grid,.ad-slot--after_grid,
 .ad-slot--footer_top{
 min-height:50px;
 contain:layout style;
 }
 .ad-slot--mid_grid{
 min-height:50px;
 contain:layout style;
 }
 /* Sembunyikan slot yang benar-benar kosong (tidak ada child yang dirender) */
 .ad-slot:empty{display:none!important;margin:0!important}

 .ad-slot ins{
 display:block!important;
 width:100%!important;
 max-width:100%!important;
 height:auto!important;
 min-height:0!important;
 }
 .ad-slot iframe{
 max-width:100%!important;
 width:100%!important;
 height:auto!important;
 min-height:0!important;
 }
 .ad-slot img{
 max-width:100%!important;
 width:auto!important;
 height:auto!important;
 display:block;
 margin:0 auto;
 }

 .ad-slot--before_grid,.ad-slot--mid_grid,.ad-slot--after_grid,.ad-slot--footer_top{
 text-align:center;
 }

}

@media(min-width:768px){
 .ad-slot ins,.ad-slot iframe,.ad-slot img{max-width:100%!important;width:auto!important}
}

.ad-slot--footer_popunder{
 position:absolute;
 width:0;height:0;
 overflow:hidden;
 pointer-events:none;
 opacity:0;
}
</style>`;
}

function adsenseScript(cfg) {
 if (!cfg.ADS_ENABLED||!cfg.ADS_ADSENSE_CLIENT) return '';
 return `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${h(cfg.ADS_ADSENSE_CLIENT)}" crossorigin="anonymous"></script>\n`;
}

function getUniqueTheme(cfg, dna) {

 if (!dna) dna = SiteDNA.get(cfg.WARUNG_DOMAIN);
 const a = cfg.THEME_ACCENT || '#ffaa00';
 const a2 = cfg.THEME_ACCENT2 || '#ffc233';
 const hexToRgb = (hex) => {
 const r=parseInt((hex||'#ffaa00').slice(1,3),16), g=parseInt((hex||'#ffaa00').slice(3,5),16), b=parseInt((hex||'#ffaa00').slice(5,7),16);
 return isNaN(r)?'255,170,0':`${r},${g},${b}`;
 };
 const dim = `rgba(${hexToRgb(a)},.15)`;
 const bg = cfg.THEME_BG || '#0a0a0a';
 const bg2 = cfg.THEME_BG2 || '#121212';
 const bg3 = cfg.THEME_BG3 || '#1a1a1a';
 const bg4 = '#1f1f1f';
 const fg = cfg.THEME_FG || '#ffffff';
 const fgDim= cfg.THEME_FG_DIM|| '#888888';
 const brd = cfg.THEME_BORDER|| '#252525';
 const brd2 = '#333';
 const font = cfg.THEME_FONT || '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
 const fontDisplay = cfg.THEME_FONT_DISPLAY || font;
 const navBg= cfg.THEME_NAV_STYLE==='gold' ? a : bg2;
 const navFg= cfg.THEME_NAV_STYLE==='gold' ? '#000' : fg;
 const cacheKey = cfg.WARUNG_DOMAIN+':theme:'+a+bg+(cfg.THEME_CARD_RATIO||'16/9')+(cfg.THEME_GRID_COLS_MOBILE||2)+fontDisplay;
 if (_themeCache.has(cacheKey)) return _themeCache.get(cacheKey);
 const result = `<style id="premium-tube-theme">
@font-face{font-family:var(--font-primary);font-display:swap}
:root{
 --accent:${a};--accent2:${a2};--accent-dim:${dim};
 --bg:${bg};--bg2:${bg2};--bg3:${bg3};--bg4:${bg4};
 --border:${brd};--border2:${brd2};
 --text:${fg};--text-dim:${fgDim};
 --nav-bg:${navBg};--nav-fg:${navFg};
 --gold:${a};--gold-dim:${dim};
 --font-primary:${font};
 --font-display:${fontDisplay};
 --card-ratio:${cfg.THEME_CARD_RATIO || '16/9'};
 --grid-cols-mobile:${cfg.THEME_GRID_COLS_MOBILE || 2};
}
* { margin:0; padding:0; box-sizing:border-box; }
html { scroll-behavior:smooth; }
body {
 font-family:var(--font-primary);
 background:var(--bg);
 color:var(--text);
 padding-bottom:calc(70px + env(safe-area-inset-bottom, 0px));
 overscroll-behavior-y:none;
 touch-action:manipulation;
 -webkit-tap-highlight-color:transparent;
}

.${dna.cls.header} {
 background:var(--bg2);
 position:sticky; top:0; z-index:100;
 border-bottom:1px solid #2a2a2a;
 padding:8px 0;
}
.${dna.cls.headerCont} {
 padding:0 12px;
 display:flex; align-items:center;
 justify-content:space-between; gap:8px;
}
.${dna.cls.logo} {
 font-size:20px; font-weight:900;
 color:var(--gold); text-decoration:none;
 white-space:nowrap; letter-spacing:-0.5px;
}
.${dna.cls.logo} span { color:var(--text); }
.${dna.cls.searchBar} {
 flex:1; background:var(--bg4); border-radius:30px;
 padding:7px 14px; display:flex; align-items:center;
 border:1px solid var(--border2); transition:border-color .2s;
}
.${dna.cls.searchBar}:focus-within { border-color:var(--gold); }
.${dna.cls.searchBar} input {
 background:none; border:none; color:var(--text);
 width:100%; font-size:13px; outline:none;
}
.${dna.cls.searchBar} input::placeholder { color:#555; }
.${dna.cls.searchBar} button {
 background:none; border:none;
 color:var(--gold); font-size:14px; cursor:pointer;
}
.${dna.cls.menuBtn} {
 background:none; border:none; color:var(--gold);
 font-size:22px; width:36px; height:36px;
 display:flex; align-items:center; justify-content:center;
 cursor:pointer; flex-shrink:0;
}

.fas,.fab,.far,.fa { display:inline-block; min-width:.875em; }

.${dna.cls.categories} {
 background:#0f0f0f; border-bottom:1px solid #222;
 padding:10px 0; overflow-x:auto;
 -webkit-overflow-scrolling:touch; scrollbar-width:none; white-space:nowrap;
}
.${dna.cls.categories}::-webkit-scrollbar { display:none; }
.${dna.cls.catInner} { padding:0 12px; display:inline-flex; gap:18px; }
.${dna.cls.cat} {
 color:var(--text-dim); text-decoration:none;
 font-size:13px; font-weight:700; padding:10px 4px;
 min-height:44px; display:inline-flex; align-items:center;
 border-bottom:2px solid transparent;
 transition:color .2s, border-color .2s; cursor:pointer;
}
.${dna.cls.cat}.${dna.cls.catActive} { color:var(--gold); border-bottom-color:var(--gold); }

.main { padding:12px; }
.${dna.cls.secHeader} {
 display:flex; justify-content:space-between; align-items:center;
 margin-bottom:12px; margin-top:4px;
}
.${dna.cls.secTitle} { font-size:15px; font-weight:800; color:var(--gold); }
.${dna.cls.secTitle} i { margin-right:6px; }
.${dna.cls.secCount} {
 background:var(--bg3); color:#aaa;
 padding:4px 10px; border-radius:20px;
 font-size:11px; border:1px solid var(--border2);
}

.${dna.cls.trendingStrip} {
 overflow-x:auto; -webkit-overflow-scrolling:touch;
 scrollbar-width:none; margin-bottom:18px;
}
.${dna.cls.trendingStrip}::-webkit-scrollbar { display:none; }
.${dna.cls.trendingInner} { display:inline-flex; gap:10px; padding:2px 0; }
.${dna.cls.tCard} {
 display:block; text-decoration:none; color:inherit;
 width:140px; background:var(--bg2);
 border-radius:8px; border:1px solid var(--border);
 overflow:hidden; flex-shrink:0; cursor:pointer;
 transition:transform .2s;
}
.${dna.cls.tCard}:hover { transform:translateY(-2px); }
.${dna.cls.tImg} {
 position:relative; aspect-ratio:var(--card-ratio,16/9);
 background:var(--bg4); overflow:hidden;
}
.${dna.cls.tImg} img { width:100%; height:100%; object-fit:cover; display:block; }
.${dna.cls.tNum} {
 position:absolute; top:4px; left:4px;
 background:var(--gold); color:#000;
 width:18px; height:18px; border-radius:4px;
 display:flex; align-items:center; justify-content:center;
 font-size:10px; font-weight:900; z-index:2;
}
.${dna.cls.tDur} {
 position:absolute; bottom:4px; right:4px;
 background:rgba(0,0,0,.85); color:#fff;
 padding:2px 5px; border-radius:3px; font-size:8px; font-weight:600;
}
.${dna.cls.tInfo} { padding:7px; }
.${dna.cls.tTitle} {
 font-size:11px; font-weight:600; color:var(--text);
 display:-webkit-box; -webkit-line-clamp:2;
 -webkit-box-orient:vertical; overflow:hidden; height:27px; line-height:1.25;
}

.${dna.cls.vGrid} {
 display:grid; gap:8px;
 grid-template-columns:repeat(var(--grid-cols-mobile),1fr);
 contain:layout style;
}
@media(min-width:480px){ .${dna.cls.vGrid}{grid-template-columns:repeat(3,1fr)} }
@media(min-width:768px){ .${dna.cls.vGrid}{grid-template-columns:repeat(4,1fr)} }
.${dna.cls.vGrid}>.ad-slot--mid_grid{grid-column:1/-1;width:100%}
.${dna.cls.vCard} {
 display:block; text-decoration:none; color:inherit;
 background:var(--bg2); border-radius:8px; overflow:hidden;
 border:1px solid var(--border); cursor:pointer;
 transition:transform .15s, border-color .2s;
}
.${dna.cls.vCard}:hover { border-color:#3a3a3a; transform:translateY(-2px); }
.${dna.cls.vImg} {
 position:relative; aspect-ratio:var(--card-ratio,16/9);
 background:var(--bg4); overflow:hidden;
}
.${dna.cls.vImg} img { width:100%; height:100%; object-fit:cover; display:block; }
.${dna.cls.badgeHot} {
 position:absolute; top:4px; left:4px;
 background:var(--gold); color:#000;
 padding:2px 6px; border-radius:4px; font-size:9px; font-weight:900;
}
.${dna.cls.badgeQual} {
 position:absolute; top:4px; right:4px;
 background:rgba(0,0,0,.8); color:var(--gold);
 padding:2px 6px; border-radius:4px; font-size:8px; font-weight:800;
 border:1px solid var(--gold);
}
.${dna.cls.badgeDur} {
 position:absolute; bottom:4px; right:4px;
 background:rgba(0,0,0,.9); color:#fff;
 padding:2px 6px; border-radius:4px; font-size:8px; font-weight:600;
}
.${dna.cls.vInfo} { padding:8px 7px 9px; }
.${dna.cls.vTitle} {
 font-size:12px; font-weight:600; color:var(--text);
 display:-webkit-box; -webkit-line-clamp:2;
 -webkit-box-orient:vertical; overflow:hidden; height:30px;
 line-height:1.28; margin-bottom:5px;
}
.${dna.cls.vMeta} { display:flex; gap:8px; color:var(--text-dim); font-size:9px; }
.${dna.cls.vMeta} i { color:var(--gold); margin-right:2px; font-size:8px; }

@keyframes shimmer {
 0% { background-position:-200% center; }
 100% { background-position:200% center; }
}
.${dna.cls.skeletonCard} .${dna.cls.vImg} {
 background:linear-gradient(90deg,#1a1a1a 25%,#2a2a2a 50%,#1a1a1a 75%);
 background-size:200% auto;
 animation:shimmer 1.4s ease-in-out infinite;
}
.${dna.cls.skeletonLine} {
 height:10px; border-radius:4px; margin-bottom:5px;
 background:linear-gradient(90deg,#1a1a1a 25%,#2a2a2a 50%,#1a1a1a 75%);
 background-size:200% auto;
 animation:shimmer 1.4s ease-in-out infinite;
}
.${dna.cls.skeletonLine}.short { width:60%; }

.${dna.cls.promoBar} {
 background:linear-gradient(135deg,#1d1200,#1a1a1a);
 border:1px solid #3a2a00; border-radius:10px;
 padding:12px; margin:16px 0;
 text-align:center; font-size:12px; font-weight:700;
 color:var(--gold);
 display:flex; align-items:center; justify-content:center; gap:8px;
 cursor:pointer;
}
.${dna.cls.promoBar} i { font-size:15px; }

.${dna.cls.tags} { display:flex; flex-wrap:wrap; gap:6px; margin:12px 0; }
.${dna.cls.tag} {
 background:var(--bg3); border:1px solid var(--border2);
 color:#aaa; padding:5px 11px; border-radius:20px;
 font-size:10px; font-weight:700; cursor:pointer; transition:all .15s;
}
.${dna.cls.tag}.active { background:var(--gold-dim); border-color:var(--gold); color:var(--gold); }

.${dna.cls.loadMore} {
 background:var(--bg3); border:1px solid var(--border2);
 color:var(--gold); padding:13px; border-radius:8px;
 text-align:center; margin:16px 0;
 font-weight:700; font-size:13px; cursor:pointer;
 transition:background .2s;
}
.${dna.cls.loadMore}:hover { background:#222; }

.${dna.cls.pagination} {
 display:none; justify-content:center;
 gap:5px; margin:16px 0; flex-wrap:wrap;
}
.${dna.cls.pg} {
 background:var(--bg3); border:1px solid var(--border2); color:#aaa;
 width:36px; height:36px; display:flex; align-items:center; justify-content:center;
 border-radius:8px; font-size:12px; font-weight:700; cursor:pointer; transition:all .15s;
}
.${dna.cls.pg}:hover { border-color:var(--gold); color:var(--gold); }
.${dna.cls.pg}.active { background:var(--gold); color:#000; border-color:var(--gold); }
.${dna.cls.pg}.wide { width:auto; padding:0 14px; }

.${dna.cls.bottomNav} {
 position:fixed; bottom:0; left:0; right:0;
 background:rgba(18,18,18,.97);
 backdrop-filter:blur(12px);
 border-top:1px solid #2a2a2a;
 display:flex; justify-content:space-around;
 padding:8px 0 12px; z-index:100;
}
.${dna.cls.bnItem} {
 color:#555; text-decoration:none; font-size:10px;
 display:flex; flex-direction:column; align-items:center; gap:3px;
 flex:1; cursor:pointer; transition:color .15s;
 min-height:48px; padding:4px 0; justify-content:center;
}
.${dna.cls.bnItem} i { font-size:19px; }
.${dna.cls.bnItem} span { font-weight:700; }
.${dna.cls.bnItem}.active { color:var(--gold); }
.${dna.cls.bnIconWrap} { position:relative; line-height:1; }
.${dna.cls.bnDot} {
 width:7px; height:7px; border-radius:50%;
 background:var(--gold); position:absolute; top:-1px; right:-1px;
}

.${dna.cls.modalOverlay} {
 display:none; position:fixed; inset:0;
 background:rgba(0,0,0,.96); z-index:200; overflow-y:auto;
}
.${dna.cls.modalOverlay}.show { display:block; }
.${dna.cls.modalInner} { padding:20px; }
.${dna.cls.modalHead} {
 display:flex; justify-content:space-between; align-items:center;
 margin-bottom:28px;
}
.${dna.cls.modalClose} {
 background:none; border:none; color:var(--gold);
 font-size:24px; cursor:pointer;
}
.${dna.cls.modalNav} { list-style:none; }
.${dna.cls.modalNav} li { margin-bottom:22px; }
.${dna.cls.modalNav} a {
 color:var(--text); text-decoration:none;
 font-size:17px; font-weight:700;
 display:flex; align-items:center; gap:16px;
}
.${dna.cls.modalNav} i { color:var(--gold); width:24px; }

.${dna.cls.footer} {
 background:var(--bg); margin-top:20px;
 padding:24px 15px 12px; border-top:1px solid #1e1e1e;
 content-visibility:auto; contain-intrinsic-size:0 300px;
}
.${dna.cls.footerGrid} {
 display:grid; grid-template-columns:repeat(2,1fr);
 gap:16px; margin-bottom:18px;
}
.${dna.cls.footerCol} h2 {
 color:var(--gold); font-size:11px; font-weight:900;
 text-transform:uppercase; letter-spacing:.5px; margin-bottom:10px;
}
.${dna.cls.footerCol} ul { list-style:none; }
.${dna.cls.footerCol} li { margin-bottom:7px; }
.${dna.cls.footerCol} a { color:#666; text-decoration:none; font-size:12px; }
.${dna.cls.footerCopy} {
 text-align:center; color:#333; font-size:10px;
 padding-top:14px; border-top:1px solid #1a1a1a;
}

.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.${dna.cls.container}{max-width:1280px;margin:0 auto;padding:0 12px;width:100%}
.${dna.cls.contentArea}{padding:12px 12px 14px;width:100%}
.${dna.cls.sectionHeader}{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid var(--border)}
.${dna.cls.sectionTitle}{font-size:1rem;font-weight:800;color:var(--gold);display:flex;align-items:center;gap:7px}
.${dna.cls.sectionCount}{background:var(--bg3);color:var(--text-dim);padding:3px 10px;border-radius:99px;font-size:.68rem;border:1px solid var(--border2)}
.${dna.cls.breadcrumb}{font-size:.78rem;margin-bottom:10px;color:var(--text-dim)}
.${dna.cls.breadcrumb} ol{list-style:none;padding:0;margin:0;display:flex;flex-wrap:wrap;align-items:center;gap:4px}
.${dna.cls.breadcrumb} li{display:inline-flex;align-items:center;gap:4px}
.${dna.cls.breadcrumb} a{color:var(--text-dim);text-decoration:none}
.${dna.cls.breadcrumb} a:hover{color:var(--gold)}
.${dna.cls.breadcrumb} .${dna.cls.bcSep}{font-size:.6rem;color:#444;margin:0 2px}
.${dna.cls.pageHeader}{padding:14px 0 10px;border-bottom:1px solid var(--border);margin-bottom:14px}
.page-label{font-size:.72rem;color:var(--text-dim);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;display:flex;align-items:center;gap:5px}
.page-label i{color:var(--accent)}
.${dna.cls.pageTitle}{font-size:1.2rem;font-weight:800;margin-bottom:8px}
.${dna.cls.pageDesc}{font-size:.82rem;color:var(--text-dim);margin-bottom:12px;line-height:1.6}
.${dna.cls.noResults}{text-align:center;padding:40px 20px;color:var(--text-dim)}
.${dna.cls.tagCloud}{display:flex;flex-wrap:wrap;gap:6px;margin:12px 0}

.${dna.cls.contentGrid}{display:grid;grid-template-columns:repeat(var(--grid-cols-mobile),1fr);gap:8px;list-style:none;padding:0}
@media(min-width:480px){.${dna.cls.contentGrid}{grid-template-columns:repeat(3,1fr)}}
@media(min-width:768px){.${dna.cls.contentGrid}{grid-template-columns:repeat(4,1fr)}}

.view-layout{padding:12px;display:flex;flex-direction:column;gap:16px;max-width:1280px;margin:0 auto;width:100%;box-sizing:border-box}
@media(min-width:900px){.view-layout{flex-direction:row;align-items:flex-start}.view-content{flex:1 1 0;min-width:0}.view-sidebar{width:320px;flex-shrink:0}}
.player-wrapper{border-radius:8px;overflow:hidden;margin-bottom:14px;background:#000;aspect-ratio:16/9}
.player-wrapper iframe,.player-wrapper video{width:100%;height:100%;border:none;display:block}
.content-title{font-size:1rem;font-weight:800;margin-bottom:8px}
.content-meta{display:flex;flex-wrap:wrap;gap:8px 10px;color:var(--text-dim);font-size:.75rem;margin-bottom:10px}
.content-meta i{color:var(--gold)}

.content-tags{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0}

.action-buttons{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
.btn{display:inline-flex;align-items:center;gap:6px;padding:10px 16px;min-height:44px;border-radius:8px;font-size:.78rem;font-weight:700;cursor:pointer;border:none;text-decoration:none;transition:all .2s}
.btn-outline{background:transparent;border:1px solid var(--border2);color:var(--text-dim)}
.btn-outline:hover{border-color:var(--gold);color:var(--gold);background:rgba(255,170,0,.07)}

.widget-title{font-size:.9rem;font-weight:800;color:var(--gold);display:flex;align-items:center;gap:7px;margin:0 0 12px;padding-bottom:10px;border-bottom:1px solid var(--border)}

.related-list{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:2px;content-visibility:auto;contain-intrinsic-size:0 200px}
.related-list li{border-bottom:1px solid var(--border)}
.related-list li:last-child{border-bottom:none}
.related-item{display:flex;gap:10px;align-items:flex-start;padding:8px 0;text-decoration:none;color:inherit;transition:background .15s;border-radius:6px}
.related-item:hover{background:var(--bg3);padding-left:6px}
.related-item img{width:90px;height:54px;object-fit:cover;border-radius:5px;flex-shrink:0;background:var(--bg3)}
.related-info{flex:1;min-width:0}
.related-title{font-size:.78rem;font-weight:700;color:var(--text);line-height:1.4;margin:0 0 4px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.related-meta{display:flex;gap:8px;flex-wrap:wrap;color:var(--text-dim);font-size:.7rem}
.badge-small{background:var(--bg3);border:1px solid var(--border2);color:var(--text-dim);padding:1px 6px;border-radius:4px;font-size:.65rem;font-weight:700;display:inline-flex;align-items:center;gap:3px}
.content-desc{margin:10px 0;font-size:.82rem;line-height:1.6;color:var(--text-dim)}
.full-desc{overflow:hidden;transition:max-height .35s ease}
.read-more{font-size:.76rem;color:var(--gold);margin-top:4px;text-decoration:underline;cursor:pointer;font-weight:700}.h1-sub{font-weight:400;font-size:.58em;opacity:.65;display:inline-block;margin-left:8px}
.seo-article{font-size:.78rem;color:var(--text-dim);line-height:1.7;content-visibility:auto;contain-intrinsic-size:0 120px}
.seo-article p{margin:0 0 8px}
.seo-article strong{color:var(--text);font-weight:600}
.alchemist-related{margin-top:14px;padding:10px 14px;background:var(--bg2);border-radius:8px;font-size:.85rem;line-height:1.8;border:1px solid var(--border)}
.alchemist-related strong{display:block;margin-bottom:6px;color:var(--text-dim);font-size:.75rem;letter-spacing:.04em;text-transform:uppercase}
.alchemist-related strong i{margin-right:5px}
.alchemist-link{color:var(--accent);text-decoration:none;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px;display:inline-block;vertical-align:bottom}
.alchemist-link:hover{text-decoration:underline;opacity:.85}

.download-wrap{max-width:680px;margin:24px auto;padding:0 12px}
.download-hero{background:var(--bg2);border:1px solid var(--border2);border-radius:12px;overflow:hidden;margin-bottom:18px}
.download-thumb{width:100%;aspect-ratio:var(--card-ratio,16/9);object-fit:cover;display:block}
.download-info{padding:14px 16px}
.download-title{font-size:1rem;font-weight:800;color:var(--text);margin:0 0 6px}
.download-meta{font-size:.76rem;color:var(--text-dim);display:flex;gap:10px;flex-wrap:wrap}
.download-section{margin-bottom:18px}
.download-section-title{font-size:.78rem;font-weight:800;color:var(--text-dim);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px}
.download-options{display:flex;flex-direction:column;gap:8px}
.download-btn{display:flex;align-items:center;justify-content:space-between;background:var(--bg2);border:1px solid var(--border2);border-radius:10px;padding:12px 16px;text-decoration:none;color:var(--text);transition:border-color .2s,background .2s}
.download-btn:hover{border-color:var(--gold);background:var(--bg3)}
.download-btn-left{display:flex;align-items:center;gap:10px}
.download-btn-icon{width:38px;height:38px;background:var(--gold);border-radius:8px;display:flex;align-items:center;justify-content:center;color:#000;font-size:.95rem;flex-shrink:0}
.download-btn-label{font-size:.85rem;font-weight:700}
.download-btn-sub{font-size:.72rem;color:var(--text-dim);margin-top:2px}
.download-btn-arrow{color:var(--gold);font-size:.9rem}
.download-photo-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px}
.download-photo-item{position:relative;border-radius:8px;overflow:hidden;background:var(--bg3)}
.download-photo-item img{width:100%;aspect-ratio:1;object-fit:cover;display:block}
.download-photo-overlay{position:absolute;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .2s}
.download-photo-item:hover .download-photo-overlay{opacity:1}
.download-photo-overlay a{color:#fff;font-size:1.3rem;text-decoration:none}
.download-all-btn{display:flex;align-items:center;justify-content:center;gap:8px;background:var(--gold);color:#000;font-weight:800;font-size:.9rem;padding:13px 20px;border-radius:10px;text-decoration:none;margin-bottom:14px;transition:opacity .2s}
.download-all-btn:hover{opacity:.85}
.download-loading{text-align:center;padding:30px;color:var(--text-dim);font-size:.85rem}
.download-error{text-align:center;padding:20px;color:#e57373;font-size:.85rem}
.btn-download{background:var(--gold)!important;color:#000!important;border-color:var(--gold)!important;font-weight:800}

.static-content h2{font-size:1.1rem;font-weight:800;margin:20px 0 10px;color:var(--text)}
.static-content p,.static-content li{margin-bottom:9px;line-height:1.75;color:var(--text-dim)}
.static-content ul,.static-content ol{padding-left:18px;margin-bottom:10px}
.static-content address{font-style:normal}
.static-content a{color:var(--gold);text-decoration:underline}

.error-page{text-align:center;padding:60px 20px}
.error-code{font-size:5rem;font-weight:900;color:var(--gold);line-height:1}
.error-message{font-size:1.1rem;font-weight:700;margin:16px 0 8px}
.error-desc{color:var(--text-dim);margin-bottom:24px}
.btn-home{display:inline-flex;align-items:center;gap:8px;background:var(--gold);color:#000;padding:12px 24px;border-radius:8px;font-weight:800;text-decoration:none}

.search-header{padding:12px 0 8px}
.search-title{font-size:.9rem;color:var(--text-dim);margin-bottom:4px}
.search-title strong{color:var(--text)}

.pagination{display:flex;align-items:center;justify-content:center;gap:6px;margin:16px 0;flex-wrap:wrap}
.page-btn{background:var(--bg3);border:1px solid var(--border2);color:var(--gold);padding:12px 18px;min-height:44px;border-radius:8px;font-size:.8rem;font-weight:700;text-decoration:none;transition:background .2s;display:inline-flex;align-items:center}
.page-btn:hover{background:#222}
.page-numbers{display:flex;gap:4px;flex-wrap:wrap}
.page-number{background:var(--bg3);border:1px solid var(--border2);color:#aaa;width:36px;height:36px;display:flex;align-items:center;justify-content:center;border-radius:8px;font-size:.78rem;font-weight:700;text-decoration:none;transition:all .15s}
.page-number:hover{border-color:var(--gold);color:var(--gold)}
.page-number.active{background:var(--gold);color:#000;border-color:var(--gold)}
.page-ellipsis{color:var(--text-dim);padding:0 4px;line-height:36px}

.album-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:7px}
.album-thumb-btn{width:100%;cursor:pointer;background:none;border:none;padding:0;border-radius:6px;overflow:hidden;display:block}
.album-thumb{width:100%;height:auto;border-radius:6px;transition:opacity .2s,transform .32s;display:block}
.album-thumb-btn:hover .album-thumb{opacity:.85;transform:scale(1.04)}

.lightbox{position:fixed;inset:0;z-index:500;background:rgba(0,0,0,.95);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(16px)}
.lightbox.hidden{display:none}
.lightbox-content{position:relative;max-width:95vw;max-height:95vh;display:flex;flex-direction:column;align-items:center}
.lightbox-image{max-width:100%;max-height:85vh;object-fit:contain;border-radius:6px}
.lightbox-close{position:absolute;top:-48px;right:0;color:#fff;font-size:1rem;background:rgba(255,255,255,.1);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center}
.lightbox-nav{display:flex;justify-content:space-between;width:100%;margin-top:12px}
.lightbox-prev,.lightbox-next{color:#fff;background:rgba(255,255,255,.1);width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center}
.lightbox-caption{color:rgba(255,255,255,.4);font-size:.76rem;text-align:center;margin-top:9px}

.toast{position:fixed;bottom:70px;left:50%;transform:translateX(-50%);background:var(--bg3);border:1px solid var(--gold);color:var(--gold);padding:9px 20px;border-radius:4px;font-size:.78rem;font-weight:700;z-index:9999;pointer-events:none}
#backToTop{position:fixed;bottom:68px;right:10px;z-index:180;width:36px;height:36px;border-radius:8px;background:var(--gold);color:#000;display:flex;align-items:center;justify-content:center;transition:opacity .3s,visibility .3s;font-size:.72rem;opacity:0;visibility:hidden}
.connection-status{position:fixed;bottom:68px;left:50%;transform:translateX(-50%);background:#ef4444;color:#fff;padding:7px 18px;border-radius:4px;font-size:.76rem;display:flex;align-items:center;gap:7px;z-index:400}

.filter-tabs{display:flex;gap:6px;flex-wrap:wrap;padding:8px 0}
.filter-tab{padding:10px 16px;min-height:44px;border-radius:99px;font-size:.78rem;font-weight:800;flex-shrink:0;display:inline-flex;align-items:center;gap:5px;color:var(--text-dim);border:1px solid var(--border2);background:var(--bg3);transition:all .2s;text-decoration:none}
.filter-tab:hover{background:var(--bg4);color:var(--text)}
.filter-tab.active{background:var(--gold);color:#000;border-color:var(--gold)}

.category-strip{background:#0f0f0f;border-bottom:1px solid #222;padding:10px 0;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;white-space:nowrap}
.category-strip::-webkit-scrollbar{display:none}
.category-strip-inner{padding:0 12px;display:inline-flex;gap:8px}
.strip-item{color:var(--text-dim);text-decoration:none;font-size:12px;font-weight:700;padding:10px 14px;min-height:44px;border-radius:99px;border:1px solid var(--border2);background:var(--bg3);transition:all .2s;white-space:nowrap;display:inline-flex;align-items:center;gap:5px}
.strip-item:hover{background:var(--bg4);color:var(--text)}
.strip-item.active{background:var(--gold);color:#000;border-color:var(--gold)}
</style>`;
 _themeCache.set(cacheKey, result);
 return result;
}

function renderHead({ title, desc, canonical, ogImage, ogType, keywords, noindex, contentId=0, contentType='meta', extraHead='', cfg, seo, request, prevUrl=null, nextUrl=null, publishedTime='', modifiedTime='', isPagePaginated=false, deliveryMode=null, extraNonces=[] }) {
 const nonce = generateNonce();
 const meta = seo.renderMeta({ title, desc, canonical, ogImage, ogType, keywords, noindex, contentId, contentType, publishedTime, modifiedTime, isPagePaginated, nonce });
 const lcpPreload = ogImage ? `<link rel="preload" as="image" href="${h(ogImage)}" fetchpriority="high">` : '';
 const prevLink = prevUrl ? `<link rel="prev" href="${h(prevUrl)}">` : '';
 const nextLink = nextUrl ? `<link rel="next" href="${h(nextUrl)}">` : '';
 const themeColor = `hsl(${hashSeed(cfg.WARUNG_DOMAIN)%360},50%,45%)`;

 const webpageSchema = JSON.stringify({
 '@context':'https://schema.org','@type':'WebPage',
 'name':title,'url':canonical,'inLanguage':cfg.SEO_LANG||'id',
 'description':desc||'',
 ...(publishedTime?{'datePublished':publishedTime}:{}),
 ...(modifiedTime?{'dateModified':modifiedTime}:publishedTime?{'dateModified':publishedTime}:{}),
 'isPartOf':{'@type':'WebSite','name':cfg.WARUNG_NAME,'url':'https://'+cfg.WARUNG_DOMAIN},
 },null,0);

 // ── Ekstrak tanah kekuasaan iklan — cached per kombinasi kode iklan ─────────────────
 const dapurDomain = (cfg._env?.DAPUR_BASE_URL||'https://dapur.dukunseo.com').replace(/https?:\/\//,'').split('/')[0];
 const _adsCspKey = [cfg.ADS_CODE_TOP_D,cfg.ADS_CODE_TOP_M,cfg.ADS_CODE_CNT_D,cfg.ADS_CODE_CNT_M,cfg.ADS_CODE_SDB_D,cfg.ADS_CODE_SDB_M,cfg.ADS_CODE_POPUNDER].map(c=>(c||'').slice(0,16)).join('|');
 let _adsCspResult = _adsCspCache.get(_adsCspKey);
 if (!_adsCspResult) {
 const preconnDomains = new Set(['fonts.googleapis.com','fonts.gstatic.com','cdnjs.cloudflare.com']);
 const scriptDomains = new Set(['cdnjs.cloudflare.com','fonts.googleapis.com','pagead2.googlesyndication.com','googleads.g.doubleclick.net']);
 const frameDomains = new Set([dapurDomain, cfg.WARUNG_DOMAIN,'googleads.g.doubleclick.net']);
 const connectDomains = new Set([cfg.WARUNG_DOMAIN, dapurDomain,'pagead2.googlesyndication.com','googleads.g.doubleclick.net']);
 const allAdCodes = [cfg.ADS_CODE_TOP_D,cfg.ADS_CODE_TOP_M,cfg.ADS_CODE_CNT_D,cfg.ADS_CODE_CNT_M,cfg.ADS_CODE_SDB_D,cfg.ADS_CODE_SDB_M,cfg.ADS_CODE_POPUNDER].filter(Boolean);
 const srcRx = /(?:src|href)=["']https?:\/\/([^/"'?\s]+)/gi;
 const ifrRx = /<iframe[^>]+src=["']https?:\/\/([^/"'?\s]+)/gi;
 for (const code of allAdCodes) {
 for (const rx of [srcRx, ifrRx]) {
 rx.lastIndex = 0;
 let m;
 while ((m = rx.exec(code)) !== null) {
 const d = m[1];
 if (!d || d.includes(cfg.WARUNG_DOMAIN)) continue;
 preconnDomains.add(d);
 scriptDomains.add(d);
 if (rx === ifrRx) { frameDomains.add(d); connectDomains.add(d); }
 else connectDomains.add(d);
 }
 }
 }
 // ── Tambah Cloudflare Insights ke CSP ─────────────────────────────────
 scriptDomains.add('static.cloudflareinsights.com');
 connectDomains.add('static.cloudflareinsights.com');

 // ── Batasi preconnect max 4 domain (hindari peringatan PageSpeed) ─────
 const _priorityPreconn = ['fonts.googleapis.com','fonts.gstatic.com','cdnjs.cloudflare.com'];
 const _otherPreconn = [...preconnDomains].filter(d => !_priorityPreconn.includes(d));
 const _selectedPreconn = [..._priorityPreconn.filter(d => preconnDomains.has(d)), ..._otherPreconn].slice(0, 4);

 _adsCspResult = {
 preconnects: _selectedPreconn.map(d=>`<link rel="dns-prefetch" href="https://${d}">\n<link rel="preconnect" href="https://${d}" crossorigin>`).join('\n'),
 script: [...scriptDomains],
 frame: [...frameDomains],
 connect: [...connectDomains],
 };
 _adsCspCache.set(_adsCspKey, _adsCspResult);
 }
 const adPreconnects = _adsCspResult.preconnects;

 const dna = SiteDNA.get(cfg.WARUNG_DOMAIN);
 const criticalCss = getUniqueTheme(cfg, dna);

 // ── CSP: style-src catatan intentional ───────────────────────────────────
 // 'unsafe-inline' di style-src dipertahankan karena template HTML punya ~100
 // inline style attribute (style="...") yang tidak pakai nonce.
 // Refactor ke CSS class adalah pekerjaan besar — dilakukan bertahap.
 // Script-src sudah strict: nonce-based, tidak ada 'unsafe-inline'.
 //
 // frame-src: diperkuat dari 'https:' (terlalu loose) ke whitelist eksplisit.
 // connect-src: diperkuat dari 'https:' ke whitelist eksplisit.
 const _frameSrcs = [`'self'`, ...new Set(_adsCspResult.frame.map(d=>`https://${d}`))];
 const _connectSrcs = [`'self'`, 'https://api.indexnow.org', 'https://www.bing.com',
  'https://yandex.com', 'https://search.seznam.cz',
  ...new Set(_adsCspResult.connect.map(d=>`https://${d}`))];
 const csp = [
 `default-src 'self' https://${cfg.WARUNG_DOMAIN}`,
 `script-src 'self' 'nonce-${nonce}'${extraNonces.map(n=>` 'nonce-${n}'`).join('')} ${_adsCspResult.script.map(d=>`https://${d}`).join(' ')}`,
 `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com`,
 `font-src 'self' data: https://fonts.gstatic.com https://cdnjs.cloudflare.com`,
 `img-src 'self' data: blob: https:`,
 `media-src 'self' blob: https:`,
 // frame-src: https: wildcard — sama seperti path4, supaya iklan tidak diblokir
 `frame-src https:`,
 // connect-src: https: wildcard — sama seperti path4
 `connect-src https:`,
 `object-src 'none'`,`base-uri 'self'`,`form-action 'self'`,
 `worker-src 'self'`,
 `manifest-src 'self'`,
 `upgrade-insecure-requests`,
 ].join('; ');

 return `<!DOCTYPE html>
<html lang="${h(cfg.SEO_LANG)}" dir="ltr">
<head>
<meta charset="UTF-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=5">
<meta name="theme-color" content="${h(themeColor)}">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
${meta}
${lcpPreload}${prevLink}${nextLink}
<link rel="dns-prefetch" href="${h(cfg.DAPUR_BASE_URL||'https://dapur.dukunseo.com')}"><!-- Cahyane rembulan ora tekan kene -->
${adPreconnects}
${criticalCss}
${cfg.THEME_FONT && cfg.THEME_FONT!=='Inter' && !cfg.THEME_FONT.includes('system') ? `<link rel="preload" href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(cfg.THEME_FONT)}:wght@400;600;700;800;900&display=swap" as="style"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(cfg.THEME_FONT)}:wght@400;600;700;800;900&display=swap" media="print" id="font-css-custom"><script nonce="${nonce}">(function(){var el=document.getElementById('font-css-custom');if(el){el.media='all';}})();<\/script>` : ''}
<link rel="preload" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/fontawesome.min.css" as="style"><link rel="preload" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/solid.min.css" as="style"><link rel="preload" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/brands.min.css" as="style"><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/fontawesome.min.css" media="print" id="font-css-fa-base"><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/solid.min.css" media="print" id="font-css-fa-solid"><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/brands.min.css" media="print" id="font-css-fa-brands"><script nonce="${nonce}">(function(){['font-css-fa-base','font-css-fa-solid','font-css-fa-brands'].forEach(function(id){var el=document.getElementById(id);if(el)el.media='all';});})()</script>
<link rel="shortcut icon" href="${urlHelper('assets/favicon.ico',cfg)}" type="image/x-icon">
<link rel="icon" href="${urlHelper('assets/favicon.ico',cfg)}" type="image/x-icon">
<link rel="icon" type="image/png" sizes="32x32" href="${urlHelper('assets/favicon-32x32.png',cfg)}">
<link rel="icon" type="image/png" sizes="16x16" href="${urlHelper('assets/favicon-16x16.png',cfg)}">
<link rel="apple-touch-icon" sizes="180x180" href="${urlHelper('assets/apple-touch-icon.png',cfg)}">
<link rel="manifest" href="${urlHelper('site.webmanifest',cfg)}">
<meta http-equiv="Content-Security-Policy" content="${h(csp)}">
${adsenseScript(cfg)}${bannerStyles()}
<script type="application/ld+json" nonce="${nonce}">${webpageSchema}</script>
${extraHead}
</head>`;
}

function renderNavHeader({ cfg, currentPage='', q='', isHome=false }) {
 const nameParts = cfg.WARUNG_NAME.split(' ');
 const logo = h(nameParts[0]) + (nameParts[1] ? `<span>${h(nameParts.slice(1).join(' '))}</span>` : '');

 const dna = SiteDNA.get(cfg.WARUNG_DOMAIN);

 const C = dna.cls, I = dna.ids;
 return `<body>
<!-- MODAL MENU -->
<div class="${C.modalOverlay}" id="${I.modalMenu}">
 <div class="${C.modalInner}">
 <div class="${C.modalHead}">
 <a href="${homeUrl(cfg)}" class="${C.logo}">${logo}</a>
 <button class="${C.modalClose}" id="${I.closeModal}"><i class="fas fa-times"></i></button>
 </div>
 <ul class="${C.modalNav}">
 <li><a href="${homeUrl(cfg)}"><i class="fas fa-home"></i> ${dna.navHome}</a></li>
 <li><a href="${homeUrl(cfg)}?trending=1" rel="nofollow"><i class="fas fa-fire"></i> ${dna.labelTrending}</a></li>
 <li><a href="${homeUrl(cfg)}?sort=newest" rel="nofollow"><i class="fas fa-star"></i> ${dna.labelTerbaru}</a></li>
 <li><a href="${homeUrl(cfg)}?sort=longest" rel="nofollow"><i class="fas fa-clock"></i> ${dna.navLabels.terlama}</a></li>
 <li><a href="${categoryUrl('video', 1, cfg)}"><i class="fas fa-video"></i> ${dna.navKatVideo}</a></li>
 <li><a href="${categoryUrl('album', 1, cfg)}"><i class="fas fa-image"></i> ${dna.navKatAlbum}</a></li>
 <li><a href="/${h(cfg.PATH_SEARCH)}"><i class="fas fa-search"></i> ${dna.verbCari} Konten</a></li>
 <li><a href="/${h(cfg.PATH_DMCA)}"><i class="fas fa-shield-alt"></i> ${dna.navDmca}</a></li>
 <li><a href="/${h(cfg.PATH_CONTACT)}"><i class="fas fa-envelope"></i> ${dna.navContact}</a></li>
 </ul>
 </div>
</div>

<!-- HEADER -->
<header class="${C.header}">
 <div class="${C.headerCont}">
 <button class="${C.menuBtn}" id="${I.menuBtn}" aria-label="${dna.ariaMenu}"><i class="fas fa-bars"></i></button>
 <a href="${homeUrl(cfg)}" class="${C.logo}">${logo}</a>
 <div class="${C.searchBar}">
 <input type="text" placeholder="${h(dna.searchPlaceholder)}" id="${I.searchInput}" value="${h(q)}">
 <button type="button" id="${I.searchBtn}" aria-label="${h(dna.verbCari)}"><i class="fas fa-search"></i></button>
 </div>
 </div>
</header>

<!-- CATEGORIES STRIP -->
<nav class="${C.categories}">
 <div class="${C.catInner}" id="${I.catList}">
 <a class="${C.cat} ${!currentPage || currentPage==='home' || isHome ? 'active' : ''}" href="${homeUrl(cfg)}">${dna.navLabels.semua}</a>
 <a class="${C.cat} ${currentPage==='trending' ? 'active' : ''}" href="${homeUrl(cfg)}?trending=1" rel="nofollow">${dna.navLabels.trending}</a>
 <a class="${C.cat} ${currentPage==='latest' ? 'active' : ''}" href="${homeUrl(cfg)}?sort=newest" rel="nofollow">${dna.navLabels.terbaru}</a>
 <a class="${C.cat} ${currentPage==='popular' ? 'active' : ''}" href="${homeUrl(cfg)}?sort=popular" rel="nofollow">${dna.navLabels.popular}</a>
 <a class="${C.cat} ${currentPage==='longest' ? 'active' : ''}" href="${homeUrl(cfg)}?sort=longest" rel="nofollow">${dna.navLabels.terlama}</a>
 <a class="${C.cat}" href="${categoryUrl('video', 1, cfg)}">${dna.navLabels.video}</a>
 <a class="${C.cat}" href="${categoryUrl('album', 1, cfg)}">${dna.navLabels.album}</a>
 ${dna.navCountries.map(c=>`<a class="${C.cat}" href="/${h(cfg.PATH_TAG)}/${h(c.path)}"> ${h(c.label)}</a>`).join('\n ')}
 </div>
</nav>`;
}

function renderFooter(cfg, request=null, nonce='') {
 const year = new Date().getFullYear();

 const dna = SiteDNA.get(cfg.WARUNG_DOMAIN);
 const C = dna.cls, I = dna.ids;

 const aboutLabel = ['About Us','Tentang','About','Info'][dna.sFooter % 4];
 const contactLabel = ['Contact','Kontak','Hubungi','Contact Us'][dna.sFooter % 4];
 const catLabel = ['Kategori','Category','Browse','Jelajahi'][(dna.sFooter+1) % 4];
 const countryLabel = ['Negara','Countries','Region','Area'][(dna.sFooter+2) % 4];
 const followLabel = ['Follow','Ikuti','Sosmed','Social'][(dna.sFooter+3) % 4];

 return `${renderBanner('footer_top', cfg, request, nonce)}
<!-- FOOTER -->
<footer class="${C.footer}">
 <div class="${C.footerGrid}">
 <div class="${C.footerCol}">
 <h2>${h(cfg.WARUNG_NAME)}</h2>
 <ul>
 <li><a href="/${h(cfg.PATH_ABOUT)}">${aboutLabel} ${h(cfg.WARUNG_NAME)}</a></li>
 <li><a href="/${h(cfg.PATH_CONTACT)}">${contactLabel} Admin</a></li>
 <li><a href="/${h(cfg.PATH_DMCA)}">${dna.footerDmca}</a></li>
 <li><a href="/${h(cfg.PATH_TERMS)}">${dna.footerTerms}</a></li>
 </ul>
 </div>
 <div class="${C.footerCol}">
 <h2>${catLabel}</h2>
 <ul>
 <li><a href="${categoryUrl('video', 1, cfg)}">${dna.footerLinkVideo}</a></li>
 <li><a href="${categoryUrl('album', 1, cfg)}">${dna.footerLinkAlbum}</a></li>
 <li><a href="/${h(cfg.PATH_SEARCH)}">${dna.footerLinkSearch}</a></li>
 <li><a href="/${h(cfg.PATH_TAG)}">${dna.footerLinkTag}</a></li>
 </ul>
 </div>
 <div class="${C.footerCol}">
 <h2>${countryLabel}</h2>
 <ul>
 ${dna.footerCountries.map(c=>`<li><a href="/${h(cfg.PATH_TAG)}/${h(c.path)}">${h(c.label)}</a></li>`).join('\n ')}
 </ul>
 </div>
 <div class="${C.footerCol}">
 <h2>${followLabel}</h2>
 <ul>
 ${dna.footerSocials.map(s=>`<li><a href="${h(s.href)}" target="_blank" rel="noopener noreferrer"><i class="${h(s.icon)}"></i> ${h(s.label)}</a></li>`).join('\n ')}
 </ul>
 </div>
 </div>
 <p style="text-align:center;font-size:11px;color:#555;margin:8px 0 4px">${h(dna.footerTagline)}</p>

 <div class="${C.footerCopy}">${h(dna.copyrightFn(cfg.WARUNG_NAME, year))}</div>
 <!-- honeytrap: invisible to users, visible to scrapers -->
 <div aria-hidden="true" style="position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;overflow:hidden" tabindex="-1">${
 (() => {
 const hp = (cfg._env?.HONEYPOT_PREFIX || 'trap').replace(/[^a-z0-9\-]/gi,'');
 const seed = hexHash(cfg.WARUNG_DOMAIN + ':footer', 8);
 return Array.from({length:6}, (_,i) => {
 const id = hexHash(seed + ':ft:' + i, 8);
 return `<a href="/${hp}/${id}" tabindex="-1" rel="nofollow">${id}</a>`;
 }).join('');
 })()
 }</div>
</footer>

<!-- BOTTOM NAV -->
<nav class="${C.bottomNav}">
 <a class="${C.bnItem} active" href="${homeUrl(cfg)}" aria-label="${dna.bnHome}">
 <div class="${C.bnIconWrap}"><i class="fas fa-home"></i></div>
 <span>${dna.bnHome}</span>
 </a>
 <a class="${C.bnItem}" href="${homeUrl(cfg)}?trending=1" rel="nofollow">
 <div class="${C.bnIconWrap}"><i class="fas fa-fire"></i><span class="${C.bnDot}"></span></div>
 <span>${dna.bnTrend}</span>
 </a>
 <a class="${C.bnItem}" href="${categoryUrl('video', 1, cfg)}">
 <div class="${C.bnIconWrap}"><i class="fas fa-video"></i></div>
 <span>${dna.bnVideo}</span>
 </a>
 <a class="${C.bnItem}" href="${categoryUrl('album', 1, cfg)}">
 <div class="${C.bnIconWrap}"><i class="fas fa-image"></i></div>
 <span>${dna.bnAlbum}</span>
 </a>
 <a class="${C.bnItem}" href="/profile">
 <div class="${dna.cls.bnIconWrap}"><i class="fas fa-user"></i></div>
 <span>${dna.bnProfil}</span>
 </a>
</nav>

<script nonce="${nonce}">
(function() {
 'use strict';

 const _C = ${JSON.stringify(dna.cls)};
 const _I = ${JSON.stringify(dna.ids)};

 const menuBtn = document.getElementById(_I.menuBtn);
 const modalMenu = document.getElementById(_I.modalMenu);
 const closeModal= document.getElementById(_I.closeModal);

 if (menuBtn && modalMenu) {
 menuBtn.addEventListener('click', () => {
 modalMenu.classList.add('show');
 document.body.style.overflow = 'hidden';
 });
 }

 if (closeModal && modalMenu) {
 closeModal.addEventListener('click', () => {
 modalMenu.classList.remove('show');
 document.body.style.overflow = '';
 });
 }

 if (modalMenu) {
 modalMenu.addEventListener('click', (e) => {
 if (e.target === modalMenu) {
 modalMenu.classList.remove('show');
 document.body.style.overflow = '';
 }
 });
 modalMenu.querySelectorAll('.' + _C.modalNav + ' a').forEach(link => {
 link.addEventListener('click', () => {
 modalMenu.classList.remove('show');
 document.body.style.overflow = '';
 });
 });
 }

 document.addEventListener('keydown', (e) => {
 if (e.key === 'Escape' && modalMenu?.classList.contains('show')) {
 modalMenu.classList.remove('show');
 document.body.style.overflow = '';
 }
 });

 const doNavSearch = function() {
 const q = document.getElementById(_I.searchInput)?.value.trim();
 if (q) {
 window.location.href = '/${h(cfg.PATH_SEARCH)}?q=' + encodeURIComponent(q);
 }
 };

 document.getElementById(_I.searchBtn)?.addEventListener('click', doNavSearch);
 document.getElementById(_I.searchInput)?.addEventListener('keydown', (e) => {
 if (e.key === 'Enter') doNavSearch();
 });

 document.getElementById(_I.catList)?.addEventListener('click', (e) => {
 const cat = e.target.closest('.' + _C.cat);
 if (!cat) return;
 document.querySelectorAll('.' + _C.cat).forEach(c => c.classList.remove('active'));
 cat.classList.add('active');
 });

 const backToTop = document.createElement('button');
 backToTop.id = _I.backToTop;
 backToTop.innerHTML = '<i class="fas fa-chevron-up"></i>';
 backToTop.setAttribute('aria-label', '${h(dna.ariaBackTop)}');
 backToTop.style.cssText = 'position:fixed;bottom:80px;right:10px;z-index:99;width:36px;height:36px;border-radius:8px;background:var(--gold);color:#000;border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;opacity:0;visibility:hidden;transition:opacity .3s,visibility .3s;';

 backToTop.addEventListener('click', () => {
 window.scrollTo({ top:0, behavior:'smooth' });
 });

 document.body.appendChild(backToTop);

 window.addEventListener('scroll', () => {
 const shouldShow = window.scrollY > 400;
 backToTop.style.opacity = shouldShow ? '1' : '0';
 backToTop.style.visibility = shouldShow ? 'visible' : 'hidden';
 }, { passive: true });

 try {
 const path = window.location.pathname + window.location.search;
 document.querySelectorAll('.' + _C.bnItem).forEach(link => {
 const href = link.getAttribute('href');
 if (href && (path === href || (href !== '/' && path.startsWith(href.split('?')[0])))) {
 document.querySelectorAll('.' + _C.bnItem).forEach(i => i.classList.remove('active'));
 link.classList.add('active');
 }
 });
 } catch (e) {}

 // ── CSP-safe image fallback — replaces all onerror inline attributes ─────
 (function() {
 function _imgErr(e) {
 var img = e.target;
 if (img.dataset.fallbackHide === '1') {
 img.style.display = 'none';
 } else if (img.dataset.fallback) {
 img.removeAttribute('srcset');
 img.src = img.dataset.fallback;
 delete img.dataset.fallback;
 }
 }
 document.addEventListener('error', _imgErr, true);
 })();
})();
<\/script>
<div id="connectionStatus" class="connection-status" role="status" aria-live="polite" style="display:none"><i class="fas fa-wifi" aria-hidden="true"></i><span>Koneksi terputus...</span></div>
</body></html>`;
}

function renderCard(item, cfg, index=99) {
 const dna = SiteDNA.get(cfg.WARUNG_DOMAIN);
 const C = dna.cls;
 const durationBadge=item.type==='video'&&item.duration>0?`<span class="${C.badgeDur}">${formatDuration(item.duration)}</span>`:'';
 const thumbUrl=safeThumb(item,cfg);
 function _srcsetUrl(url, w) {
 try { const u = new URL(url); u.searchParams.set('w', String(w)); return u.toString(); }
 catch { return url + (url.includes('?') ? '&' : '?') + 'w=' + w; }
 }
 const srcset = `${h(_srcsetUrl(thumbUrl,320))} 320w, ${h(_srcsetUrl(thumbUrl,640))} 640w`;
 const isAboveFold=index<4;
 const isLcp=index===0;
 const imgAttrs=isLcp?`loading="eager" fetchpriority="high" decoding="async"`:isAboveFold?`loading="eager" decoding="async"`:`loading="lazy" decoding="async"`;
 const iUrl=item.type==='album'?albumUrl(item.id,item.title,cfg):contentUrl(item.id,item.title,cfg);
 const shortTitle=mbSubstr(item.title,0,60);

 const hotBadge=index%6===0&&cfg.THEME_BADGE_HOT?`<span class="${C.badgeHot}">${h(cfg.THEME_BADGE_HOT)}</span>`:'';
 const qualBadge=item.quality_label?`<span class="${C.badgeQual}">${h(item.quality_label)}</span>`:`<span class="${C.badgeQual}">HD</span>`;

 const views = formatViews(item.views||0);
 const timeAgo = item.created_at ? formatDate(item.created_at) : '';

 function _webpUrl(url) {
 try { const u = new URL(url); u.searchParams.set('fm', 'webp'); return u.toString(); }
 catch { return url + (url.includes('?') ? '&' : '?') + 'fm=webp'; }
 }
 function _avifUrl(url) {
 try { const u = new URL(url); u.searchParams.set('fm', 'avif'); return u.toString(); }
 catch { return url + (url.includes('?') ? '&' : '?') + 'fm=avif'; }
 }
 const webpUrl = _webpUrl(thumbUrl);

 return `<a class="${C.vCard}" href="${h(iUrl)}">
 <div class="${C.vImg}">
 <picture>
 <source srcset="${h(_avifUrl(_srcsetUrl(thumbUrl,320)))} 320w, ${h(_avifUrl(_srcsetUrl(thumbUrl,640)))} 640w" sizes="(max-width:480px) 320px, 640px" type="image/avif">
 <source srcset="${h(_webpUrl(_srcsetUrl(thumbUrl,320)))} 320w, ${h(_webpUrl(_srcsetUrl(thumbUrl,640)))} 640w" sizes="(max-width:480px) 320px, 640px" type="image/webp">
 <img src="${h(thumbUrl)}" srcset="${srcset}" sizes="(max-width:480px) 320px, 640px" alt="${h(_altText(item, { context:'card', domain:cfg.WARUNG_DOMAIN, siteName:cfg.WARUNG_NAME, index }))}" ${imgAttrs} width="320" height="180" data-fallback="${h(cfg.DEFAULT_THUMB)}">
 </picture>
 ${hotBadge}
 ${qualBadge}
 ${durationBadge}
 </div>
 <div class="${C.vInfo}">
 <div class="${C.vTitle}">${h(shortTitle)}</div>
 <div class="${C.vMeta}">
 <span><i class="fas fa-eye"></i>${views}</span>
 ${timeAgo?`<span><i class="fas fa-clock"></i>${timeAgo}</span>`:''}
 </div>
 </div>
 </a>`;
}

function renderGrid(items, cfg, midBannerEnabled=true, request=null, nonce='') {
 const dna = SiteDNA.get(cfg.WARUNG_DOMAIN);
 const insertAfter = getAdsSlots(cfg)['mid_grid']?.insert_after || 6;
 let html=`<div class="${dna.cls.vGrid}">`;
 items.forEach((item,i) => {
 html+=renderCard(item,cfg,i);
 if (midBannerEnabled && (i+1)%insertAfter===0) html+=renderBannerMidGrid(i,cfg,request,nonce);
 });
 html+='</div>';
 return html;
}

function renderPagination(pagination, buildUrl, cfg) {
 if (!pagination) return '';

 const page = Math.max(1, parseInt(pagination.current_page || pagination.page || 1, 10));
 const total = Math.max(1, parseInt(pagination.total_pages || pagination.last_page || pagination.pageCount || 1, 10));
 if (isNaN(page) || isNaN(total) || total <= 1) return '';

 const hasPrev = pagination.has_prev !== undefined ? pagination.has_prev : page > 1;
 const hasNext = pagination.has_next !== undefined ? pagination.has_next : page < total;
 const dna = cfg ? SiteDNA.get(cfg.WARUNG_DOMAIN) : null;
 const pgPrev = dna ? dna.pgPrev : 'Sebelumnya';
 const pgNext = dna ? dna.pgNext : 'Berikutnya';
 const pgAriaNav = dna ? dna.pgAriaNav : 'Navigasi halaman';
 const pgAria = dna ? dna.pgAriaPage : 'Halaman';
 let html=`<nav class="pagination" aria-label="${h(pgAriaNav)}">`;
 if (hasPrev) html+=`<a href="${buildUrl(page-1)}" class="page-btn" rel="prev"><i class="fas fa-chevron-left" aria-hidden="true"></i> ${h(pgPrev)}</a>`;
 html+='<div class="page-numbers">';
 const showPages=[];
 if (total<=7) { for (let p=1;p<=total;p++) showPages.push(p); }
 else {
 showPages.push(1); if (page>3) showPages.push('…');
 for (let p=Math.max(2,page-1);p<=Math.min(total-1,page+1);p++) showPages.push(p);
 if (page<total-2) showPages.push('…'); showPages.push(total);
 }
 showPages.forEach(p=>{
 if (p==='…') html+=`<span class="page-ellipsis">…</span>`;
 else html+=`<a href="${buildUrl(p)}" class="page-number${p===page?' active':''}" ${p===page?'aria-current="page"':`aria-label="${h(pgAria)} ${p}"`}>${p}</a>`;
 });
 html+='</div>';
 if (hasNext) html+=`<a href="${buildUrl(page+1)}" class="page-btn" rel="next">${h(pgNext)} <i class="fas fa-chevron-right" aria-hidden="true"></i></a>`;
 html+='</nav>';
 return html;
}

function renderTrendingMobile(trending, cfg) {
 // WebP + srcset helpers untuk trending strip
 function _srcsetUrl(url, w) {
  try { const u = new URL(url); u.searchParams.set('w', String(w)); return u.toString(); }
  catch { return url + (url.includes('?') ? '&' : '?') + 'w=' + w; }
 }
 function _twpUrl(url) {
  try { const u = new URL(url); u.searchParams.set('fm', 'webp'); return u.toString(); }
  catch { return url + (url.includes('?') ? '&' : '?') + 'fm=webp'; }
 }
 if (!trending?.length) return '';
 const dna = SiteDNA.get(cfg.WARUNG_DOMAIN);
 const C = dna.cls;

 return `<div class="${C.trendingStrip}">
 <div class="${C.trendingInner}">
 ${trending.slice(0,8).map((item,i)=>`
 <a class="${C.tCard}" href="${h(itemUrl(item,cfg))}">
 <div class="${C.tImg}">
 <picture>
 <source srcset="${h(_twpUrl(_srcsetUrl(safeThumb(item,cfg),140)))} 140w, ${h(_twpUrl(_srcsetUrl(safeThumb(item,cfg),280)))} 280w" sizes="140px" type="image/webp">
 <img src="${h(safeThumb(item,cfg))}" srcset="${h(_srcsetUrl(safeThumb(item,cfg),140))} 140w, ${h(_srcsetUrl(safeThumb(item,cfg),280))} 280w" sizes="140px" alt="${h(_altText(item, { context:'trending', domain:cfg.WARUNG_DOMAIN, siteName:cfg.WARUNG_NAME, index:i }))}" loading="${i===0?'eager':'lazy'}"${i===0?' fetchpriority="high"':''} decoding="async" width="140" height="79" data-fallback="${h(cfg.DEFAULT_THUMB)}">
 </picture>
 <span class="${C.tNum}">${i+1}</span>
 <span class="${C.tDur}">${item.duration ? formatDuration(item.duration) : ''}</span>
 </div>
 <div class="${C.tInfo}">
 <div class="${C.tTitle}">${h(mbSubstr(item.title,0,40))}</div>
 </div>
 </a>
 `).join('')}
 </div>
 </div>`;
}

function renderBreadcrumb(items, cfg) {
 const dna = SiteDNA.get(cfg.WARUNG_DOMAIN);
 const C = dna.cls;
 return `<nav class="${C.breadcrumb}" aria-label="${h(dna.ariaBreadcrumb)}">
<ol itemscope itemtype="https://schema.org/BreadcrumbList">
${items.map((item,i)=>`<li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">${item.url?`<a href="${h(item.url)}" itemprop="item"><span itemprop="name">${h(item.name)}</span></a>`:`<span itemprop="name" aria-current="page">${h(item.name)}</span>`}<meta itemprop="position" content="${i+1}">${i<items.length-1?`<i class="fas fa-chevron-right ${C.bcSep}" aria-hidden="true"></i>`:''}</li>`).join('\n')}
</ol></nav>`;
}


// renderLayout removed — dead code, not called from any handler

async function handle404(cfg, seo, request) {
 const dna = SiteDNA.get(cfg.WARUNG_DOMAIN);
 const canonical=seo.canonical('/404');
 const footNonce=generateNonce();
 const head=renderHead({ title:dna.err404Title+' | '+cfg.WARUNG_NAME, desc:'Halaman yang kamu cari tidak ditemukan di '+cfg.WARUNG_NAME+'.', canonical, ogImage:cfg.SEO_OG_IMAGE, ogType:'website', noindex:true, cfg, seo, request, extraHead:'', extraNonces:[footNonce] });
 const nav=renderNavHeader({cfg});
 const body=`<main id="${dna.ids.mainContent}"><section class="${dna.cls.errorPage}"><div class="${dna.cls.container}"><div class="${dna.cls.errorContent}">
 <div class="error-icon"><i class="fas fa-exclamation-triangle"></i></div>
 <h1 class="error-title">404</h1>
 <p class="error-subtitle">${h(dna.err404Subtitle)}</p>
 <p class="error-desc">${h(dna.err404Desc)}</p>
 <div class="error-actions"><a href="${homeUrl(cfg)}" class="btn btn-primary"><i class="fas fa-home"></i> ${h(dna.err404Back)}</a><a href="${searchUrl('',cfg)}" class="btn btn-outline"><i class="fas fa-search"></i> ${h(dna.err404Search)}</a></div>
</div></div></section></main>`;
 return new Response(head+nav+body+renderFooter(cfg,request,footNonce), { status:404, headers:htmlHeaders(cfg,'page') });
}

async function handleProfile(request, cfg, client, seo) {
 const dna = SiteDNA.get(cfg.WARUNG_DOMAIN);
 const env = cfg._env || {};
 const ev = (k, fb) => env[k] || cfg[k] || fb;

 const authorName = ev('AUTHOR_NAME', cfg.CONTACT_EMAIL_NAME || cfg.WARUNG_NAME);
 const authorBio = ev('AUTHOR_BIO', cfg.WARUNG_TAGLINE || dna.profileAuthorBioFn(cfg.WARUNG_NAME));
 const authorAvatar = ev('AUTHOR_AVATAR', cfg.SEO_OG_IMAGE);
 const authorTwitter = ev('AUTHOR_TWITTER', '');
 const authorFB = ev('AUTHOR_FACEBOOK', '');
 const authorIG = ev('AUTHOR_INSTAGRAM','');

 const [_profTrendRes] = await Promise.allSettled([
 client.getTrending(8).catch(() => ({ data: [] })),
 ]);
 const trendingRes = _profTrendRes.status === 'fulfilled' ? _profTrendRes.value : { data: [] };
 const trending = trendingRes?.data || [];

 const canonical = seo.canonical('/profile');
 const pageTitle = `${dna.profileLabel} ${h(authorName)} | ${cfg.WARUNG_NAME}`;
 const pageDesc = `${h(authorBio)} — ${cfg.WARUNG_NAME} (${cfg.WARUNG_DOMAIN})`;
 const footNonce = generateNonce();

 const personSchema = JSON.stringify({
 '@context': 'https://schema.org',
 '@type': 'Person',
 name: authorName,
 description: authorBio,
 image: authorAvatar,
 url: 'https://' + cfg.WARUNG_DOMAIN + '/profile',
 worksFor: {
 '@type': 'Organization',
 name: cfg.WARUNG_NAME,
 url: 'https://' + cfg.WARUNG_DOMAIN,
 },
 ...(authorTwitter ? { sameAs: ['https://twitter.com/' + authorTwitter] } : {}),
 });

 const breadcrumbSchema = JSON.stringify({
 '@context': 'https://schema.org', '@type': 'BreadcrumbList',
 itemListElement: [
 { '@type': 'ListItem', position: 1, name: cfg.WARUNG_NAME, item: 'https://' + cfg.WARUNG_DOMAIN + '/' },
 { '@type': 'ListItem', position: 2, name: dna.profileLabel, item: canonical },
 ],
 });

 const extraHead = `
<script type="application/ld+json" nonce="${footNonce}">${personSchema}</script>
<script type="application/ld+json" nonce="${footNonce}">${breadcrumbSchema}</script>`;

 const head = renderHead({
 title: pageTitle, desc: pageDesc, canonical,
 ogImage: authorAvatar, ogType: 'profile',
 keywords: cfg.WARUNG_NAME+', admin, '+cfg.SEO_KEYWORDS,
 noindex: false, cfg, seo, request,
 extraHead, extraNonces: [footNonce],
 });
 const nav = renderNavHeader({ cfg });

 const breadcrumbHtml = renderBreadcrumb([
 { name: dna.berandaLabel, url: homeUrl(cfg) },
 { name: dna.profileLabel, url: null },
 ], cfg);

 const socialLinks = [
 authorTwitter && `<a href="https://twitter.com/${h(authorTwitter)}" class="${dna.cls.tag}" target="_blank" rel="noopener noreferrer"><i class="fab fa-twitter"></i> @${h(authorTwitter)}</a>`,
 authorIG && `<a href="https://instagram.com/${h(authorIG)}" class="${dna.cls.tag}" target="_blank" rel="noopener noreferrer"><i class="fab fa-instagram"></i> @${h(authorIG)}</a>`,
 authorFB && `<a href="${h(authorFB)}" class="${dna.cls.tag}" target="_blank" rel="noopener noreferrer"><i class="fab fa-facebook"></i> Facebook</a>`,
 `<a href="mailto:${h(cfg.CONTACT_EMAIL)}" class="${dna.cls.tag}"><i class="fas fa-envelope"></i> ${h(cfg.CONTACT_EMAIL)}</a>`,
 ].filter(Boolean).join('\n');

 const trendingHtml = trending.length
 ? `<div style="margin-top:1.5rem">
 <h3 style="font-size:.95rem;color:var(--text-dim);margin-bottom:.75rem;text-transform:uppercase;letter-spacing:.05em">${h(dna.profileKontenPilihan)}</h3>
 <ul class="${dna.cls.contentGrid}">${trending.map((item, i) => `<li>${renderCard(item, cfg, i)}</li>`).join('')}</ul>
 </div>`
 : '';

 const body = `
<main id="${dna.ids.mainContent}">
 <div class="${dna.cls.container}" style="padding-top:2rem;padding-bottom:3rem">
 ${breadcrumbHtml}
 <div style="max-width:860px;margin:0 auto">

 <!-- Avatar + Info -->
 <div style="display:flex;align-items:center;gap:1.5rem;flex-wrap:wrap;background:var(--bg-card,#1e222b);border-radius:var(--border-radius,8px);padding:2rem;box-shadow:var(--shadow-sm);margin-bottom:2rem">
 <picture><source srcset="${h((() => { try { const u=new URL(authorAvatar); u.searchParams.set('fm','webp'); u.searchParams.set('w','200'); return u.toString(); } catch { return authorAvatar+(authorAvatar.includes('?')?'&':'?')+'fm=webp&w=200'; } })())}" type="image/webp"><img src="${h(authorAvatar)}" alt="${h(authorName)}"
 style="width:100px;height:100px;border-radius:50%;object-fit:cover;border:3px solid var(--accent,#ffaa00);flex-shrink:0"
 width="100" height="100"
 loading="eager" fetchpriority="high" decoding="async" data-fallback="${h(cfg.SEO_OG_IMAGE)}"></picture>
 <div style="flex:1;min-width:180px">
 <h1 style="font-size:1.6rem;font-weight:700;margin:0 0 .35rem;color:var(--text-color)">${h(authorName)}</h1>
 <p style="font-size:.9rem;color:var(--text-dim);margin:0 0 .75rem;line-height:1.6">${h(authorBio)}</p>
 <div style="display:flex;flex-wrap:wrap;gap:.5rem">${socialLinks}</div>
 </div>
 </div>

 <!-- Detail Warung -->
 <div style="background:var(--bg-card,#1e222b);border-radius:var(--border-radius,8px);padding:1.5rem 2rem;margin-bottom:2rem;box-shadow:var(--shadow-sm)">
 <h2 style="font-size:1rem;text-transform:uppercase;letter-spacing:.05em;color:var(--text-dim);margin:0 0 1rem">${h(dna.profileTentangWarungFn(cfg.WARUNG_NAME))}</h2>
 <table style="width:100%;border-collapse:collapse;font-size:.9rem">
 <tr><td style="padding:.5rem 0;color:var(--text-dim);width:35%"><i class="fas fa-globe"></i> Domain</td><td style="padding:.5rem 0"><a href="https://${h(cfg.WARUNG_DOMAIN)}/" style="color:var(--accent)">${h(cfg.WARUNG_DOMAIN)}</a></td></tr>
 <tr><td style="padding:.5rem 0;color:var(--text-dim)"><i class="fas fa-tag"></i> Tagline</td><td style="padding:.5rem 0">${h(cfg.WARUNG_TAGLINE || '')}</td></tr>
 <tr><td style="padding:.5rem 0;color:var(--text-dim)"><i class="fas fa-envelope"></i> Kontak</td><td style="padding:.5rem 0"><a href="mailto:${h(cfg.CONTACT_EMAIL)}" style="color:var(--accent)">${h(cfg.CONTACT_EMAIL)}</a></td></tr>
 <tr><td style="padding:.5rem 0;color:var(--text-dim)"><i class="fas fa-info-circle"></i> ${h(dna.profileTentang)}</td><td style="padding:.5rem 0"><a href="/${h(cfg.PATH_ABOUT)}" style="color:var(--accent)">${h(dna.profileHalamanTentang)}</a></td></tr>
 </table>
 </div>

 <!-- Konten Trending -->
 ${trendingHtml}

 </div>
 </div>
</main>`;

 return new Response(head + nav + body + renderFooter(cfg, request, footNonce), {
 status: 200,
 headers: htmlHeaders(cfg, 'article'),
 });
}

async function handleHome(request, cfg, client, seo) {
 const dna = SiteDNA.get(cfg.WARUNG_DOMAIN);
 const url=new URL(request.url);
 const page=Math.max(1, safeParseInt(url.searchParams.get('page'), 1));
 const type=getContentTypes(cfg).includes(url.searchParams.get('type')||'') ? url.searchParams.get('type') : '';
 const sortParam=url.searchParams.get('sort')||'';
 const isTrending=url.searchParams.has('trending')||url.searchParams.get('trending')==='1';
 const sortOrder = isTrending ? 'popular' : (['newest','popular','views','longest'].includes(sortParam) ? sortParam : 'newest');
 const deliveryMode=getDeliveryMode(request);

 // isTrending: skip getMediaList, langsung pakai getTrending untuk isi grid
 // getMediaList(sort:popular) bisa return kosong kalau API tidak support → halaman kosong
 const _trendingCount = isTrending ? Math.max(cfg.ITEMS_PER_PAGE||20, cfg.TRENDING_COUNT||20) : cfg.TRENDING_COUNT;
 const _contentType = getContentTypes(cfg).length===1 ? getContentTypes(cfg)[0] : '';

 // OPT: skip trending fetch saat page>1 — tidak ditampilkan di halaman paginasi
 // Hemat 1 subrequest per halaman 2+ = signifikan untuk CF free tier
 const _skipTrending = page > 1 && !isTrending && !cfg.THEME_SHOW_TRENDING;
 const [_mediaRes, _trendRes] = await Promise.allSettled([
 isTrending
 ? Promise.resolve(null) // skip getMediaList saat trending
 : client.getMediaList({ page, per_page:cfg.ITEMS_PER_PAGE, type:type||undefined, sort:sortOrder }),
 _skipTrending ? Promise.resolve({data:[]}) : client.getTrending(_trendingCount, _contentType),
 ]);
 const mediaResult = _mediaRes.status === 'fulfilled' ? _mediaRes.value : null;
 const trendingResult= _trendRes.status === 'fulfilled' ? _trendRes.value : null;
 const trending=trendingResult?.data||[];

 // isTrending: items diambil dari trending, bukan mediaResult
 // sort=popular: fallback ke trending jika getMediaList return kosong
 const _mediaItems = mediaResult?.data||[];
 const items = isTrending
 ? trending.slice(0, cfg.ITEMS_PER_PAGE||20)
 : (sortParam==='popular' && !_mediaItems.length && trending.length)
 ? trending.slice(0, cfg.ITEMS_PER_PAGE||20) // fallback ke trending data
 : _mediaItems;
 const pagination = (isTrending || (sortParam==='popular' && !_mediaItems.length))
 ? {} // tidak ada pagination untuk trending/popular-fallback
 : (mediaResult?.meta?.pagination||mediaResult?.meta||{});
 const paginationTotal = pagination.total_pages||pagination.last_page||pagination.pageCount||1;
 const pageTitle=page>1?dna.homeTitlePgFn(cfg.WARUNG_NAME,page):`${cfg.WARUNG_NAME} — ${cfg.WARUNG_TAGLINE}`;
 const pageDesc=page>1?dna.homeDescPgFn(page,cfg.SEO_DEFAULT_DESC):cfg.SEO_DEFAULT_DESC;
 let canonical;
 const buildCanonicalParams = (pg=page) => {
 const p = new URLSearchParams();
 if (type) p.set('type', type);
 if (isTrending) p.set('trending', '1');
 else if (sortParam && sortParam !== 'newest') p.set('sort', sortParam);
 if (pg > 1) p.set('page', String(pg));
 const qs = p.toString();
 return qs ? `/?${qs}` : '/';
 };
 canonical = seo.canonical(buildCanonicalParams(), request);
 const homeExtraHead=(!type&&!isTrending&&!sortParam&&page===1)
 ? seo.websiteSchema('https://'+cfg.WARUNG_DOMAIN+'/'+cfg.PATH_SEARCH+'?q={search_term_string}')+seo.itemListSchema(items,canonical,cfg)+seo.breadcrumbSchema([{name:cfg.WARUNG_NAME,url:'/'}],'/')
 : (page>1&&!type&&!isTrending&&!sortParam)
 ? seo.itemListSchema(items,canonical,cfg)+seo.breadcrumbSchema([{name:cfg.WARUNG_NAME,url:'/'},{name:dna.homeTitlePgFn(cfg.WARUNG_NAME,page),url:null}],buildCanonicalParams())
 : seo.itemListSchema(items,canonical,cfg);
 // ── Preload gambar pertama sebagai LCP hint (PageSpeed) ──────────────────
 const _lcpHomeImg = (items.length > 0 && page === 1) ? safeThumb(items[0], cfg) : null;
 const _lcpHomePreload = _lcpHomeImg ? `<link rel="preload" as="image" href="${h(_lcpHomeImg)}" fetchpriority="high">` : '';
 const homeExtraHeadFinal = homeExtraHead + _lcpHomePreload;
 const prevUrl=page>1?seo.canonical(buildCanonicalParams(page-1)):null;
 const nextUrl=page<paginationTotal?seo.canonical(buildCanonicalParams(page+1)):null;
 const homeKeywords=page===1?cfg.SEO_KEYWORDS:(type||'')+' halaman '+page+', '+cfg.SEO_KEYWORDS;
 const adNonce=generateNonce();

 const head=renderHead({ title:pageTitle, desc:pageDesc, canonical, ogImage:(page===1&&items[0]?.thumbnail)||cfg.SEO_OG_IMAGE, ogType:'website', noindex:page>10&&!items.length||page>15, keywords:homeKeywords, cfg, seo, request, deliveryMode, extraHead:homeExtraHeadFinal, prevUrl, nextUrl, isPagePaginated:page>1, extraNonces:[adNonce] });
 const nav=renderNavHeader({ cfg, isHome:!isTrending&&!sortParam, currentPage: isTrending?'trending':sortParam==='popular'?'popular':sortParam==='newest'?'latest':sortParam==='longest'?'longest':'' });
 const filterTabsItems=getContentTypes(cfg).map(t=>{
 const meta=TYPE_META[t]||{label:ucfirst(t),icon:'fa-file'};
 return `<a href="/?type=${t}" class="strip-item ${type===t?'active':''}" role="tab" aria-selected="${type===t?'true':'false'}" rel="nofollow"><i class="fas ${meta.icon}" aria-hidden="true"></i> ${meta.label}</a>`;
 }).join('');
 const filterTabs=`<div role="tablist" aria-label="${h(dna.ariaFilterTab)}"><a href="/" class="strip-item ${!type&&!sortParam&&!isTrending?'active':''}" role="tab" aria-selected="${!type&&!sortParam&&!isTrending?'true':'false'}">${h(dna.tabSemua)}</a>${filterTabsItems}</div>`;
 let contentSection='';
 if (!items.length) {
 contentSection=`<div class="empty-state"><i class="fas fa-folder-open"></i><p>${h(dna.homeEmptyMsg)}</p></div>`;
 } else {
 // ── Per-referrer grid shuffle ──────────────────────────────────────────
 // Visitor dari keyword berbeda → urutan konten berbeda → behavioral signal unik per SERP
 const _refQuery = extractSearchQuery(request.headers.get('Referer') || '');
 const _gridItems = (_refQuery && page === 1)
 ? seededShuffle([...items], hashSeed(dna.gridShuffleSalt + ':' + _refQuery.toLowerCase().slice(0, 40)))
 : items;
 contentSection=renderBanner('before_grid',cfg,request,adNonce)+renderGrid(_gridItems,cfg,true,request,adNonce)
 +renderPagination(pagination, p=>{
 const params=new URLSearchParams();
 if (type) params.set('type',type);
 if (isTrending) params.set('trending','1');
 else if (sortParam&&sortParam!=='newest') params.set('sort',sortParam);
 if (p>1) params.set('page',String(p));
 const qs=params.toString();
 return qs?`/?${qs}`:'/';
 }, cfg)
 +(cfg.THEME_SHOW_PROMO?`<div class="promo-banner"><i class="fas fa-crown"></i> ${h(cfg.THEME_PROMO_TEXT)} <i class="fas fa-crown"></i></div>`:'')
 +renderBanner('after_grid',cfg,request,adNonce);
 }
 const sectionTitle = isTrending ? dna.navLabels.trending
 : sortParam==='popular' ? dna.navLabels.popular
 : sortParam==='newest' ? dna.navLabels.terbaru
 : sortParam==='longest' ? dna.navLabels.terlama
 : type ? ucfirst(h(type))
 : dna.sectionTitleDefault;
 const seoIntroBlock = (page===1&&!type&&!isTrending&&!sortParam)
 ? `<div style="padding:0 12px 8px;max-width:1280px;margin:0 auto">
 <h1 style="font-size:.82rem;font-weight:500;color:var(--text-dim);margin:0 0 2px;padding:4px 0 0;line-height:1.5;letter-spacing:0">${h(cfg.WARUNG_NAME)} — ${h(cfg.WARUNG_TAGLINE||'streaming video & album gratis')}</h1>
 <p style="font-size:.78rem;color:var(--text-dim);line-height:1.6;margin:0;padding:0 0 2px">${h(dna.seoIntroTpl(cfg.WARUNG_NAME, cfg.WARUNG_TAGLINE||'video dan album'))}</p>
 </div>`
 : '';
 const main=`<main id="${dna.ids.mainContent}"><nav class="${dna.cls.categoryStrip}" aria-label="Filter kategori"><div class="${dna.cls.catStripInner}">${filterTabs}</div></nav>${renderBanner('header_top',cfg,request,adNonce)}${cfg.THEME_SHOW_TRENDING&&!deliveryMode?.lite?renderTrendingMobile(trending,cfg):''}${seoIntroBlock}<div class="${dna.cls.container}"><div class="${dna.cls.layoutMain}">
<section class="${dna.cls.contentArea}">
 <div class="${dna.cls.sectionHeader}"><h2 class="${dna.cls.sectionTitle}"><i class="fas fa-fire" aria-hidden="true"></i> ${sectionTitle}${page>1?` <span class="section-page">${h(dna.sectionPageLbl)}${page}</span>`:''}</h2></div>
 ${contentSection}
</section>
</div></div></main>`;
 return new Response(head+nav+main+renderFooter(cfg,request,adNonce), { status:200, headers:htmlHeaders(cfg,'home') });
}

async function handleView(request, cfg, client, seo, segments, _earlyP={}) {
 const dna = SiteDNA.get(cfg.WARUNG_DOMAIN);
 const id=safeParseInt(segments[1], 0);
 if (!id||id<1) return handle404(cfg,seo,request);
 const reqPath=(segments[0]||'').toLowerCase();
 if (cfg.WARUNG_TYPE==='A'&&reqPath===cfg.PATH_ALBUM.toLowerCase()) return handle404(cfg,seo,request);
 if (cfg.WARUNG_TYPE==='B'&&reqPath===cfg.PATH_CONTENT.toLowerCase()) return handle404(cfg,seo,request);

 // ── Semua 5 fetch jalan parallel sejak awal ───────────────────────────────
 // _earlyP berisi Promise yang sudah dimulai di main handler sebelum await dapurConfig selesai.
 // getPlayerUrl/getDownloadUrl/getAlbum tidak butuh itemResult — hanya butuh id.
 // Fallback ke fetch baru jika earlyP tidak ada (cold path / route mismatch).
 const [_itemRes, _relRes, _playerRes, _dlRes, _albumRes] = await Promise.allSettled([
 _earlyP.mediaP || client.getMediaDetail(id),
 _earlyP.relatedP|| client.getRelated(id, cfg.RELATED_COUNT),
 _earlyP.playerP || client.getPlayerUrl(id),
 _earlyP.dlP || client.getDownloadUrl(id),
 _earlyP.albumP || client.getAlbum(id),
 ]);
 const itemResult = _itemRes.status === 'fulfilled' ? _itemRes.value : null;
 const relatedResult= _relRes.status === 'fulfilled' ? _relRes.value : null;
 const playerUrl = _playerRes.status === 'fulfilled' ? _playerRes.value : null;
 const downloadUrl = _dlRes.status === 'fulfilled' ? _dlRes.value : null;
 const albumResult = _albumRes.status === 'fulfilled' ? _albumRes.value : null;

 if (!itemResult?.data) {
 if (itemResult?.status === 'error' && (itemResult?.code === 503 || itemResult?.code === 0)) {
 return new Response(dna.serviceErrMsg, {
 status: 503,
 headers: { 'Retry-After': '30', 'Content-Type': 'text/plain; charset=UTF-8' },
 });
 }
 return handle404(cfg, seo, request);
 }
 if (itemResult?.status === 'error') return handle404(cfg, seo, request);
 const media=itemResult?.data;
 if (!getContentTypes(cfg).includes(media.type)) return handle404(cfg,seo,request);
 const type=media.type||'video', related=relatedResult?.data||[];
 const _ua = request.headers.get('User-Agent') || '';
 if (!isSearchBot(_ua) && !isScraperBot(_ua) && client.ctx?.waitUntil) {
 client.ctx.waitUntil(client.recordView(id));
 }
 // ── IndexNow: ping saat konten pertama kali diakses ──────────────────────
 if (client.ctx?.waitUntil) {
 const hammer0 = IndexingHammer.get(cfg._env || {}, cfg);
 const fullUrl = 'https://' + cfg.WARUNG_DOMAIN + (type==='album' ? albumUrl(id, media.title, cfg) : contentUrl(id, media.title, cfg));
 client.ctx.waitUntil(hammer0.pingOnFirstView(fullUrl, id).catch(()=>{}));
 }
 let albumPhotos=[];
 if (type==='album') albumPhotos = albumResult?.data?.photos||[];
 const fp=seo.generateUniqueSchema(id,type);
 const pageUrl=type==='album'?albumUrl(id,media.title,cfg):contentUrl(id,media.title,cfg);
 const canonical=seo.canonical(pageUrl);

 // ── Auto Canonical Cluster — redirect near-duplicate slug ke URL kanonik ──
 // Contoh: /tonton/123/judul-lama → 301 → /tonton/123/judul-benar
 // Hemat crawl budget: hanya 1 URL per konten yang diindex Google
 const reqSlug = (segments[2] || '').toLowerCase();
 const canonSlug = makeSlug(media.title || '');
 if (canonSlug && reqSlug !== canonSlug) {
 // Slug beda (typo, judul lama, tanpa slug) → permanent redirect ke canonical
 return new Response(null, {
 status: 301,
 headers: {
 'Location': canonical,
 'Cache-Control': 'public, max-age=86400, s-maxage=86400',
 'X-Canonical-Redirect': '1',
 },
 });
 }

 // ── Auto Canonical v2 — ML Seed Dynamic Cluster ────────────────────────────
 // Cluster URL berdasarkan vektor HDC + Xoshiro seed → redirect ke cluster centroid
 // Jauh lebih agresif dari v1 (slug match) — tangkap variasi judul lintas waktu
 if (cfg.HDC_ENABLED !== false && cfg.AUTO_CANONICAL_V2 !== false) {
 try {
 const _acv2Vec = _hdcDocVec(media.title || '', cfg.WARUNG_DOMAIN);
 if (_acv2Vec) {
 const _acv2Seed = new Xoshiro128(hashSeed(cfg.WARUNG_DOMAIN + ':canonical:' + id));
 // FIX #C: SemanticIndex._store tidak pernah dideklarasikan → selalu undefined → falsy.
 // Auto Canonical v2 tidak pernah bekerja. Gunakan _hdcDocCache (LRUMap global)
 // yang menyimpan vektor per key "domain:id" — sudah terisi oleh bumbuItem().
 // OPT: pool 20→50 — tangkap "kembaran tersembunyi" yang populer-rendah tapi mirip-tinggi.
 // CPU: 50 similarity ops ~0.05ms. Worst-case tetap O(50×314), jauh di bawah CF 10ms budget.
 const _acv2Candidates = _hdcDocCache.size > 0
 ? [..._hdcDocCache.entries()]
  .filter(([k, e]) => k.startsWith(cfg.WARUNG_DOMAIN + ':') && e.id !== id && e.id < id)
  .map(([, e]) => e)
  .sort((a,b) => (b.views||0) - (a.views||0))
  .slice(0, 50)
 : [];
 // FIX #E.1: collect semua kandidat + sort by similarity, ambil best — bukan first-hit.
 // Sebelumnya: return di iterasi pertama yang lewat threshold → kandidat indo (high views)
 // yang sort-pertama menang, meski ada kandidat score 0.97 di posisi views lebih rendah.
 // FIX #E.2: cand.url dari _hdcDocCache adalah null (diisi hanya saat query via itemUrl).
 // Sebelumnya: cand.url || '' → '' → redirect ke 'https://domain.com' = homepage.
 // Fix: panggil itemUrl(cand, cfg) secara eksplisit, sama seperti scanAll().
 let _acv2Best = null;
 for (const cand of _acv2Candidates) {
 if (!cand.vec) continue;
 const sim = _hdcSimilarity(_acv2Vec, cand.vec);
 if (sim >= _HDC_THRESH_CV2) {
  if (!_acv2Best || sim > _acv2Best.sim) _acv2Best = { cand, sim };
  if (sim >= 0.95) break; // early-exit: sim sangat tinggi, tidak perlu cari lebih baik lagi
 }
 }
 if (_acv2Best) {
 const candUrl = 'https://' + cfg.WARUNG_DOMAIN + itemUrl(_acv2Best.cand, cfg);
 return new Response(null, {
 status: 301,
 headers: {
 'Location': candUrl,
 'Cache-Control': 'public, max-age=86400, s-maxage=86400',
 'X-Canonical-V2': '1',
 'X-Similarity': String(Math.round(_acv2Best.sim * 100)) + '%',
 'X-Cluster-Seed': String(_acv2Seed.next() & 0xFFFF),
 },
 });
 }
 } // end _acv2Vec null guard
 } catch { /* non-fatal */ }
 }

 // ── Alchemist ensureIndex — mulai lebih awal, parallel dengan HDC scan (sync CPU) ──
 // ensureIndex hanya blocking saat cold (no index). Kalau warm, return ~0ms via stale-while-revalidate.
 // Dimulai di sini agar network request ke Dapur (refresh) bisa inflight saat HDC scan jalan.
 let _alchemistEnsureP = null;
 if (cfg.ALCHEMIST_ENABLED === true && media.description) {
 try {
 const _alchemistEarly = Alchemist.get(cfg);
 _alchemistEnsureP = _alchemistEarly.ensureIndex(client, client.ctx?.waitUntil?.bind(client.ctx))
 .catch(err => { logError('Alchemist.ensureIndex.early', err); });
 } catch(err) { logError('Alchemist.get.early', err); }
 }

 // ── HDC D1 warm — load persisted vectors ke memory saat cold start ──────
 // FIX 3: Fast-path KV snapshot, coalescing guard cegah thundering herd.
 if (cfg.HDC_ENABLED !== false && client.db) {
  if (!_hdcWarmInFlight.has(cfg.WARUNG_DOMAIN)) {
   _hdcWarmInFlight.add(cfg.WARUNG_DOMAIN);
   const _warmP = SemanticIndex.warmFromD1(client.db, cfg.WARUNG_DOMAIN, cfg._env?.KV)
    .catch(() => {})
    .finally(() => _hdcWarmInFlight.delete(cfg.WARUNG_DOMAIN));
   client.ctx?.waitUntil?.(_warmP);
  }
 }

 // ── HDC single-pass scan — fuzzy canonical + hybrid + cluster sekaligus ──
 // scanAll() menggantikan 3 loop terpisah (findSimilar + mergeRecommendations + getCluster)
 // Hasil disimpan di _hdcScanResult dan dikonsumsi di bawah.
 let _hdcScanResult = null;
 if (cfg.HDC_ENABLED !== false) {
 try {
 SemanticIndex.index(media, cfg.WARUNG_DOMAIN);
 // ── HDC D1 persist — simpan vector baru ke D1 sebagai secondary cache ──
 // INSERT OR IGNORE: hanya entry baru, tidak update yang sudah ada. Non-blocking.
 if (client.db) {
  client.ctx?.waitUntil?.(
   SemanticIndex.persistToD1(client.db, cfg.WARUNG_DOMAIN).catch(() => {})
  );
 }
 _hdcScanResult = SemanticIndex.scanAll(id, cfg.WARUNG_DOMAIN, cfg, related);
 // Fuzzy Canonical — redirect hanya ke konten lebih tua atau lebih populer
 const { nearDupe } = _hdcScanResult;
 if (nearDupe.length && nearDupe[0].score >= _HDC_THRESH_CANONICAL) {
 const dupe = nearDupe[0];
 const dupeIsOlder = dupe.id < id;
 const dupeIsPopular = (dupe.views || 0) > (media.views || 0) * 1.5;
 if (dupeIsOlder || dupeIsPopular) {
 return new Response(null, {
 status: 301,
 headers: {
 'Location': 'https://' + cfg.WARUNG_DOMAIN + dupe.url,
 'Cache-Control': 'public, max-age=3600, s-maxage=3600',
 'X-Fuzzy-Canonical': '1',
 'X-Similarity': String(Math.round(nearDupe[0].score * 100)) + '%',
 },
 });
 }
 }
 } catch { /* non-fatal — lanjut render */ }
 }
 const _qualLabel = media.quality_label ? ' ' + media.quality_label : '';
 const _baseTitle = (media._original_title || media.title || '').trim();
 const _titleWithQual = (_baseTitle + _qualLabel).trim();
 const pageTitle = seo.title(_titleWithQual, id, type);
 const pageDesc=seo.description(media.title,id,type,media.views||0);
 const ogImage=media.thumbnail||cfg.SEO_OG_IMAGE;
 const ogType=type==='video'?'video.movie':'article';
 const keywords=media.tags?.length?media.tags.slice(0,10).join(', '):cfg.SEO_KEYWORDS;
 const publishedTime=isoDate(media.created_at);
 const modifiedTime=isoDate(media.updated_at||media.created_at);
 const isHidden=media.status==='hidden'||media.status==='draft'||media.private===true;
 // FIX: ImageObject schema untuk album foto — Google Images
  const _albumImgSch = (type==='album'&&albumPhotos.length)
   ? seo.albumImageSchema(albumPhotos,media,canonical,cfg) : '';
  // ── HDC schema — inject ItemList ke <head> setelah scan selesai ──────────
  // Dipanggil setelah _hdcScanResult tersedia (di bawah) tapi extraHead dibutuhkan di sini.
  // Solusi: defer schema build ke closure — schema string dicompute saat adNonce tersedia.
 // adNonce di-generate dulu — dipakai oleh schema, renderHead, dan renderBanner
 const adNonce=generateNonce();
  const _hdcSchemaParts = [];
  if (cfg.HDC_ENABLED !== false && _hdcScanResult) {
   const { merged, cluster } = _hdcScanResult;
   if (merged?.length) _hdcSchemaParts.push(SemanticIndex.renderHybridSchema(merged, pageUrl, cfg, adNonce));
   if (cluster?.length) _hdcSchemaParts.push(SemanticIndex.renderClusterSchema(cluster, pageUrl, cfg, adNonce));
  }
  const extraHead=seo.contentSchema(media,canonical,playerUrl)
   +_albumImgSch
   +seo.breadcrumbSchema([{name:dna.berandaLabel,url:'/'},{name:ucfirst(type),url:'/'+cfg.PATH_CATEGORY+'/'+type},{name:media.title,url:null}],pageUrl)
   +_hdcSchemaParts.join('');
 // prev/next: tidak ada sequence linier di single content — jangan pakai tag URL sebagai prev
 // (Google bisa salah menginterpretasikan sebagai pagination, padahal ini konten independen)
 const viewPrevUrl=null;
 const viewNextUrl=null;
 const head=renderHead({ title:pageTitle, desc:pageDesc, canonical, ogImage, ogType, keywords, noindex:isHidden, cfg, seo, request, extraHead, contentId:id, contentType:type, publishedTime, modifiedTime, prevUrl:viewPrevUrl, nextUrl:viewNextUrl, extraNonces:[adNonce] });
 const nav=renderNavHeader({cfg});
 let playerHtml='';
 if (type==='video') {
 playerHtml=`<div class="player-wrapper">${media.thumbnail?`<meta itemprop="thumbnailUrl" content="${h(media.thumbnail)}">`:""}${media.created_at?`<meta itemprop="uploadDate" content="${h(ensureTz(media.created_at)||new Date().toISOString())}">`:""}${media.duration>0?`<meta itemprop="duration" content="${isoDuration(parseInt(media.duration,10))}">`:""}${playerUrl?`<meta itemprop="embedUrl" content="${h(safeUrl(playerUrl))}">`:""}${media._original_title?`<meta itemprop="name" content="${h(media._original_title)}">`:""}<iframe src="${h(safeUrl(playerUrl))}" allowfullscreen loading="eager" class="player-frame" title="${h(media.title)}" data-id="${id}" width="1280" height="720" sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-pointer-lock allow-downloads" referrerpolicy="strict-origin-when-cross-origin" aria-label="${h(dna.ariaPlayerFn(media.title))}"></iframe></div>`;
 } else if (type==='album') {

 function _albumSrcsetUrl(url, w) {
 try { const u = new URL(url); u.searchParams.set('w', String(w)); return u.toString(); }
 catch { return url + (url.includes('?') ? '&' : '?') + 'w=' + w; }
 }
 playerHtml=`<div class="album-grid" role="list">${albumPhotos.map((photo,i)=>`<div class="album-item" role="listitem"><button type="button" class="album-thumb-btn js-lightbox-open" data-src="${h(photo.url)}" data-idx="${i}" data-title="${h(media.title)}" aria-label="${dna.ariaFoto} ${i+1}"><picture>
 <source srcset="${h((() => { try { const u=new URL(photo.url); u.searchParams.set('fm','webp'); u.searchParams.set('w','320'); return u.toString(); } catch { return photo.url+'?fm=webp&w=320'; } })())} 320w, ${h((() => { try { const u=new URL(photo.url); u.searchParams.set('fm','webp'); u.searchParams.set('w','640'); return u.toString(); } catch { return photo.url+'?fm=webp&w=640'; } })())} 640w" sizes="(max-width:480px) 320px, 640px" type="image/webp">
 <img src="${h(photo.url)}" srcset="${h(_albumSrcsetUrl(photo.url,320))} 320w, ${h(_albumSrcsetUrl(photo.url,640))} 640w" sizes="(max-width:480px) 320px, 640px" alt="${h(_altText(media, { context:'album', domain:cfg.WARUNG_DOMAIN, siteName:cfg.WARUNG_NAME, photoIndex:i }))}" loading="${i<4?'eager':'lazy'}" decoding="async" class="album-thumb" width="320" height="240">
</picture></button></div>`).join('')}${!albumPhotos.length?`<p class="empty-state">${h(dna.fotoTidakAda)}</p>`:''}</div>`;
 }
 // FIX SEO: tambah kalimat intro di sekitar tags — Google dapat konteks relevansi
 const _tagsIntro = ['Topik terkait:','Jelajahi juga:','Kategori serupa:','Tag konten:','Konten serupa di:','Lihat juga:','Terkait dengan:'][hashSeed(cfg.WARUNG_DOMAIN+':tagi') % 7];
 const tagsHtml=media.tags?.length?`<div class="content-tags" role="list" aria-label="${_tagsIntro}"><span class="tags-intro" style="font-size:.78rem;color:var(--text-dim);margin-right:4px">${_tagsIntro}</span>${media.tags.map(t=>`<a href="${h(tagUrl(t,cfg))}" class="${dna.cls.tag}" role="listitem">#${h(t)}</a>`).join('')}</div>`:'';

 const popularTags=media.tags?.slice(5,12).map(t=>`<a href="${h(tagUrl(t,cfg))}" class="${dna.cls.tag}">#${h(t)}</a>`).join('')||''; let descHtml='';
 if (media.description&&type!=='story') {
 const short=mbSubstr(stripTags(media.description),0,300);
 // FIX SEO: full-desc pakai max-height bukan display:none — Google tetap crawl teks
 descHtml=`<div class="content-desc" itemprop="description"><p>${h(short)}</p>${media.description.length>300?`<button type="button" class="read-more js-toggle-desc" aria-expanded="false" aria-controls="full-desc-${id}">${h(dna.readMoreLabel)}</button><div id="full-desc-${id}" class="full-desc" style="max-height:0;overflow:hidden" aria-hidden="true">${nl2br(h(media.description))}</div>`:''}</div>`;
 }

 let alchemistHtml = '';
 if (cfg.ALCHEMIST_ENABLED === true && media.description) {
 try {
 const alchemist = Alchemist.get(cfg);
 const maxLinks = cfg.ALCHEMIST_MAX_LINKS || 3;
 // Await promise yang sudah dimulai sebelum HDC scan — bukan mulai baru di sini.
 // Kalau _alchemistEnsureP null (Alchemist.get throw), skip gracefully.
 if (_alchemistEnsureP) await _alchemistEnsureP;
 alchemistHtml = alchemist.generateInternalLinks(media.description, id, maxLinks, cfg.WARUNG_DOMAIN);
 } catch (err) {
 logError('Alchemist.handleView', err);
 }
 }

 // ── relatedHtml dideklarasi di sini agar tersedia untuk hybridWidget fallback ──
 const relatedHtml=related.length?`<ol class="related-list">${related.map(rel=>`<li><a href="${h(itemUrl(rel,cfg))}" class="related-item"><picture>
 <source srcset="${h((() => { try { const u=new URL(safeThumb(rel,cfg)); u.searchParams.set('fm','webp'); u.searchParams.set('w','90'); return u.toString(); } catch { return safeThumb(rel,cfg)+'?fm=webp&w=90'; } })())}" type="image/webp">
 <img src="${h(safeThumb(rel,cfg))}" alt="${h(_altText(rel, { context:'related', domain:cfg.WARUNG_DOMAIN, siteName:cfg.WARUNG_NAME }))}" loading="lazy" decoding="async" width="90" height="54" data-fallback="${h(cfg.DEFAULT_THUMB)}">
</picture><div class="related-info"><p class="related-title">${h(mbSubstr(rel.title,0,50))}</p><small class="related-meta"><span class="badge-small"><i class="fas ${TYPE_ICONS[rel.type]||'fa-file'}"></i> ${h(rel.type||'video')}</span><span><i class="fas fa-eye"></i> ${formatViews(rel.views||0)}</span></small></div></a></li>`).join('')}</ol>`:`<p class="empty-state">${h(dna.relatedEmpty)}</p>`;

 // ── 🧠 Rekomendasi Hybrid (API + HDC) + Cluster Topik ────────────────────────
 // Menggunakan _hdcScanResult dari scanAll() di atas — zero loop tambahan
 let hybridWidget = '';
 let clusterWidget = '';
 if (cfg.HDC_ENABLED !== false) {
 try {
 if (_hdcScanResult) {
 const { merged, cluster } = _hdcScanResult;
 hybridWidget = SemanticIndex.renderHybridWidget(merged, cfg);
 clusterWidget = SemanticIndex.renderClusterWidget(cluster, cfg);
 }
 } catch (err) {
 logError('SemanticIndex.hybrid', err);
 hybridWidget = related.length
 ? `<h2 class="widget-title"><i class="fas fa-layer-group"></i> ${dna.relatedFallbackTitle}</h2>${relatedHtml}`
 : '';
 }
 // Fallback: _hdcScanResult null (scan error / cold cache) atau merged kosong
 // → tetap tampilkan related dari API agar rekomendasi tidak hilang
 if (!hybridWidget && related.length) {
 hybridWidget = `<h2 class="widget-title"><i class="fas fa-layer-group"></i> ${dna.relatedFallbackTitle}</h2>${relatedHtml}`;
 }
 } else {
 // HDC disabled — tampilkan related biasa
 hybridWidget = related.length
 ? `<h2 class="widget-title"><i class="fas fa-layer-group"></i> ${dna.relatedFallbackTitle}</h2>${relatedHtml}`
 : '';
 }

 const typeLower = (type||'video').toLowerCase();
 // FIX SEO: inject data API nyata ke seoArticle — Google crawl teks ini untuk memahami topik
 const _artTitle = h(media.title);
 const _artViews = media.views > 0 ? ` Sudah ditonton ${formatViews(media.views)} kali.` : '';
 const _artDur = (type==='video' && media.duration > 0) ? ` Durasi ${formatDuration(media.duration)}.` : '';
 const _artTags = media.tags?.length ? ' Terkait: ' + media.tags.slice(0,4).map(t=>h(t)).join(', ') + '.' : '';
 const _artDate = media.created_at ? ' Diunggah ' + formatDate(media.created_at) + '.' : '';
 const seoArticle = `<section class="seo-article" style="margin-top:14px;padding-top:12px;border-top:1px solid var(--border)">
<p>${dna.seoArtP1Fn(_artTitle, typeLower, h(cfg.WARUNG_NAME))}${_artViews}${_artDur}</p>
<p>${dna.seoArtP2Fn()}</p>
<p>${dna.seoArtP3Fn(typeLower)}${_artTags}${_artDate}</p>
</section>`;
 // FIX: H1 pakai title yang sudah dibumbu — konsisten dengan homepage & breadcrumb
 const _h1Title = media.title;
 const _h1Qual = media.quality_label ? ' ' + media.quality_label : '';
 const _ischema = type==="video" ? "https://schema.org/VideoObject" : "https://schema.org/ImageGallery";
 const contentInfo=`<div class="content-info" itemscope itemtype="${_ischema}"><h1 class="content-title" itemprop="name">${h(_h1Title)}${h(_h1Qual)}</h1>
<div class="content-meta">
 <span class="badge"><i class="fas ${TYPE_ICONS[type]||'fa-file'}" aria-hidden="true"></i> ${h(ucfirst(type))}</span>
 <span itemprop="interactionCount"><i class="fas fa-eye"></i> ${formatViews(media.views||0)} ${dna.viewerLabel}</span>
 ${media.duration>0?`<span itemprop="duration" content="${isoDuration(parseInt(media.duration,10))}"><i class="fas fa-clock"></i> ${formatDuration(media.duration)}</span>`:''}
 <span><time datetime="${publishedTime}" itemprop="datePublished"><i class="fas fa-calendar-alt"></i> ${formatDate(media.created_at||'')}</time></span>
</div>
${tagsHtml}${descHtml}${alchemistHtml}${seoArticle}
<div class="action-buttons">
 <button type="button" id="btnCopyLink" class="btn btn-outline" data-url="${h(canonical)}"><i class="fas fa-link"></i> ${dna.btnCopyLink}</button>
 <button type="button" id="btnShare" class="btn btn-outline"><i class="fas fa-share-alt"></i> ${dna.btnShare}</button>
 ${(type==='album' || (type==='video' && downloadUrl)) ? `<a href="/download/${id}" class="btn btn-outline btn-download"><i class="fas fa-download"></i> ${dna.btnDownload}</a>` : ''}
</div>
<div class="social-share" style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;">
 <a href="https://wa.me/?text=${encodeURIComponent(media.title+' '+canonical)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline" style="background:#25d366;color:#fff;border-color:#25d366" aria-label="${h(dna.ariaShareWA)}"><i class="fab fa-whatsapp"></i> WhatsApp</a>
 <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(canonical)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline" style="background:#1877f2;color:#fff;border-color:#1877f2" aria-label="${h(dna.ariaShareFB)}"><i class="fab fa-facebook"></i> Facebook</a>
 <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(media.title)}&url=${encodeURIComponent(canonical)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline" style="background:#1da1f2;color:#fff;border-color:#1da1f2" aria-label="${h(dna.ariaShareTW)}"><i class="fab fa-twitter"></i> Twitter</a>
 <a href="https://t.me/share/url?url=${encodeURIComponent(canonical)}&text=${encodeURIComponent(media.title)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline" style="background:#0088cc;color:#fff;border-color:#0088cc" aria-label="${h(dna.ariaShareTG)}"><i class="fab fa-telegram"></i> Telegram</a>
</div></div>`;
 const lightboxHtml=type==='album'?`<div id="lightbox" class="lightbox hidden" role="dialog" aria-modal="true"><div class="lightbox-content"><img id="lightbox-img" src="" alt="" loading="lazy" decoding="async" class="lightbox-image" width="1280" height="720"><button type="button" id="lightboxClose" class="lightbox-close" aria-label="${h(dna.lbClose)}"><i class="fas fa-times"></i></button><div class="lightbox-nav"><button type="button" id="lightboxPrev" class="lightbox-prev" aria-label="${h(dna.lbPrev)}"><i class="fas fa-chevron-left"></i></button><button type="button" id="lightboxNext" class="lightbox-next" aria-label="${h(dna.lbNext)}"><i class="fas fa-chevron-right"></i></button></div><div class="lightbox-caption" id="lightbox-caption"></div></div></div>
<script nonce="${adNonce}">var _lb={idx:0,photos:${JSON.stringify(albumPhotos.map(p=>p.url))},titles:${JSON.stringify(albumPhotos.map(()=>media.title))}};function openLightbox(src,i,t){_lb.idx=i;var img=document.getElementById('lightbox-img'),cap=document.getElementById('lightbox-caption'),lb=document.getElementById('lightbox');img.src=src;img.alt=t+' - Foto '+(i+1);cap.textContent=t+' ('+(i+1)+' / '+_lb.photos.length+')';lb.classList.remove('hidden');document.body.style.overflow='hidden';lb.querySelector('.lightbox-close').focus();}function closeLightbox(e){if(!e||e.target===e.currentTarget||e.target.closest('.lightbox-close')){var lb=document.getElementById('lightbox');lb.classList.add('hidden');document.body.style.overflow='';}}function navigateLightbox(d){var n=(_lb.idx+d+_lb.photos.length)%_lb.photos.length;_lb.idx=n;var img=document.getElementById('lightbox-img'),cap=document.getElementById('lightbox-caption');img.src=_lb.photos[n];cap.textContent=_lb.titles[n]+' ('+(n+1)+' / '+_lb.photos.length+')';}(function(){var lb=document.getElementById('lightbox'),lc=document.getElementById('lightboxClose'),lp=document.getElementById('lightboxPrev'),ln=document.getElementById('lightboxNext');if(lb)lb.addEventListener('click',function(e){if(e.target===lb)closeLightbox(e);});if(lc)lc.addEventListener('click',closeLightbox);if(lp)lp.addEventListener('click',function(){navigateLightbox(-1);});if(ln)ln.addEventListener('click',function(){navigateLightbox(1);});document.querySelectorAll('.js-lightbox-open').forEach(function(btn){btn.addEventListener('click',function(){openLightbox(btn.dataset.src,parseInt(btn.dataset.idx),btn.dataset.title);});});})();document.addEventListener('keydown',function(e){var lb=document.getElementById('lightbox');if(lb&&!lb.classList.contains('hidden')){if(e.key==='Escape')closeLightbox();if(e.key==='ArrowLeft')navigateLightbox(-1);if(e.key==='ArrowRight')navigateLightbox(1);}});<\/script>`:'';;
 const pageScript=`<script nonce="${adNonce}">var _dna=${JSON.stringify({toastCopied:dna.toastCopied,promptCopy:dna.promptCopy,readMore:dna.readMoreLabel,close:dna.closeLbl})};function copyLink(btn){var url=btn.dataset.url||location.href;if(navigator.clipboard){navigator.clipboard.writeText(url).then(()=>showToast(_dna.toastCopied)).catch(()=>fallbackCopy(url));}else fallbackCopy(url);}function fallbackCopy(text){var ta=document.createElement('textarea');ta.value=text;ta.style.cssText='position:fixed;opacity:0;top:-999px';document.body.appendChild(ta);ta.select();try{document.execCommand('copy');showToast(_dna.toastCopied);}catch{prompt(_dna.promptCopy,text);}document.body.removeChild(ta);}function showToast(msg){var ex=document.querySelector('.toast');ex&&ex.remove();var t=document.createElement('div');t.className='toast';t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.parentNode&&t.remove(),2200);}function shareContent(){if(navigator.share){navigator.share({title:${JSON.stringify(media.title)},url:location.href}).catch(()=>{});}else copyLink({dataset:{url:location.href}});}function toggleDesc(btn){var id=btn.getAttribute('aria-controls'),fd=document.getElementById(id);if(!fd)return;var open=btn.getAttribute('aria-expanded')==='true';if(open){fd.style.maxHeight='0';fd.classList.add('hidden');}else{fd.classList.remove('hidden');fd.style.maxHeight=fd.scrollHeight+'px';}fd.setAttribute('aria-hidden',String(open));btn.setAttribute('aria-expanded',String(!open));btn.textContent=open?_dna.readMore:_dna.close;}

(function(){var cp=document.getElementById('btnCopyLink'),sh=document.getElementById('btnShare');if(cp)cp.addEventListener('click',function(){copyLink(this);});if(sh)sh.addEventListener('click',shareContent);document.querySelectorAll('.js-toggle-desc').forEach(function(b){b.addEventListener('click',function(){toggleDesc(this);});});})();<\/script>`;
 const breadcrumbHtml=renderBreadcrumb([{name:dna.berandaLabel,url:homeUrl(cfg)},{name:'Semua '+ucfirst(type),url:categoryUrl(type,1,cfg)},{name:mbSubstr(media.title,0,40),url:null}],cfg);
 const main=`<main id="${dna.ids.mainContent}" class="${dna.cls.viewMain}"><div class="${dna.cls.viewLayout}">
<article class="view-content">
 ${renderBanner('header_top',cfg,request,adNonce)}
 ${breadcrumbHtml}${playerHtml}${contentInfo}
 ${renderBanner('after_content',cfg,request,adNonce)}
 ${renderBanner('before_grid',cfg,request,adNonce)}
</article>
<aside class="view-sidebar">
 ${renderBanner('sidebar_top',cfg,request,adNonce)}
 ${hybridWidget}
 ${clusterWidget}
 ${renderBanner('sidebar_mid',cfg,request,adNonce)}
 ${popularTags?`<section><h3 class="widget-title" style="margin-top:16px"><i class="fas fa-tags"></i> ${dna.tagWidgetTitle}</h3><div class="${dna.cls.tagCloud}">${popularTags}</div></section>`:''}
 ${pasfRenderWidget(pasfGetRelated(cfg.WARUNG_DOMAIN, media.title || '', cfg), cfg)}
 ${renderBanner('sidebar_bottom',cfg,request,adNonce)}
</aside>
</div></main>${lightboxHtml}${pageScript}`;
 const popunderView = renderBanner('footer_popunder', cfg, request, adNonce);

 // ── ETag + Conditional Request (304 Not Modified) ───────────────────────
 // ETag stabil dari konten identifier — tidak berubah selama konten sama.
 // Googlebot dan browser cache-aware bisa skip download kalau konten tidak berubah.
 const _etag = _makeETag(cfg.WARUNG_DOMAIN, String(id), media.updated_at || media.created_at || '', String(media.views || 0));
 const _lastMod = media.updated_at || media.created_at || null;
 const _304 = _checkConditional(request, _etag, _lastMod);
 if (_304) return _304;

 const _viewHeaders = Object.assign(htmlHeaders(cfg, 'article'), {
  'ETag': _etag,
  ...((_lastMod) && { 'Last-Modified': new Date(_lastMod).toUTCString() }),
 });
 return new Response(head+nav+main+renderFooter(cfg,request,adNonce)+popunderView, { status:200, headers:_viewHeaders });
}

async function handleDownload(request, cfg, client, seo, segments) {
 const id = safeParseInt(segments[1], 0);
 if (!id || id < 1) return handle404(cfg, seo, request);

 const itemResult = await client.getMediaDetail(id);
 if (!itemResult?.data || itemResult?.status === 'error') return handle404(cfg, seo, request);
 const media = itemResult.data;
 const type = media.type || 'video';
 const dna = SiteDNA.get(cfg.WARUNG_DOMAIN);
 const canonical = seo.canonical(type === 'album' ? albumUrl(id, media.title, cfg) : contentUrl(id, media.title, cfg));
 const thumb = media.thumbnail || cfg.SEO_OG_IMAGE;
 const adNonce = generateNonce();
 const dlKeywords = (media.tags||[]).slice(0,5).join(', ') || cfg.SEO_KEYWORDS;
 const dlPublished = media.created_at ? isoDate(media.created_at) : '';
 const dlSchema = seo.contentSchema(media, canonical, '')+seo.breadcrumbSchema([
 {name:dna.berandaLabel,url:'/'},{name:dna.dlPageVerb,url:null},{name:media.title,url:null}
 ],'/download/'+id);

 const head = renderHead({
 title: `${dna.dlPageVerb} ${h(media.title)} | ${cfg.WARUNG_NAME}`,
 desc: dna.dlDescTpl(dna.dlPageVerb, media.title, cfg.WARUNG_NAME),
 canonical: seo.canonical('/download/' + id),
 ogImage: thumb, ogType: type==='video'?'video.movie':'website',
 noindex: true, keywords: dlKeywords, publishedTime: dlPublished,
 extraHead: dlSchema,
 cfg, seo, request, extraNonces: [adNonce],
 });
 const nav = renderNavHeader({ cfg });

 let bodyHtml = '';

 if (type === 'video') {

 const [_dlRes, _playerRes] = await Promise.allSettled([
 client.getDownloadUrl(id),
 client.getPlayerUrl(id),
 ]);
 const dlUrl = _dlRes.status === 'fulfilled' ? _dlRes.value : null;
 const playerUrl = _playerRes.status === 'fulfilled' ? _playerRes.value : null;

 const qualityOptions = dlUrl
 ? `<div class="download-options">
 <a href="${h(safeUrl(dlUrl))}" class="download-btn" target="_blank" rel="noopener noreferrer">
 <div class="download-btn-left">
 <div class="download-btn-icon"><i class="fas fa-film"></i></div>
 <div>
 <div class="download-btn-label">${h(dna.dlVideoLbl)}</div>
 <div class="download-btn-sub">${h(dna.dlSubQual)}</div>
 </div>
 </div>
 <i class="fas fa-chevron-right download-btn-arrow"></i>
 </a>
 <a href="${h(safeUrl(playerUrl) || canonical)}" class="download-btn" target="_blank" rel="noopener noreferrer">
 <div class="download-btn-left">
 <div class="download-btn-icon" style="background:#333;color:var(--gold)"><i class="fas fa-play"></i></div>
 <div>
 <div class="download-btn-label">${h(dna.dlWatchOnline)}</div>
 <div class="download-btn-sub">${h(dna.dlSubOnline)}</div>
 </div>
 </div>
 <i class="fas fa-chevron-right download-btn-arrow"></i>
 </a>
 </div>`
 : `<div class="download-error"><i class="fas fa-exclamation-circle"></i> ${h(dna.dlNoLink)} <a href="${h(canonical)}" style="color:var(--gold)">${h(dna.dlWatchOnline).toLowerCase()}</a>.</div>`;

 bodyHtml = `
 <div class="download-hero">
 <picture>
 <source srcset="${h((() => { try { const u=new URL(thumb); u.searchParams.set('fm','webp'); u.searchParams.set('w','640'); return u.toString(); } catch { return thumb+'?fm=webp&w=640'; } })())}" type="image/webp">
 <picture><source srcset="${h((() => { try { const u=new URL(thumb); u.searchParams.set('fm','webp'); u.searchParams.set('w','640'); return u.toString(); } catch { return thumb+(thumb.includes('?')?'&':'?')+'fm=webp&w=640'; } })())}" type="image/webp"><img src="${h(thumb)}" alt="${h(_altText(media, { context:'download', domain:cfg.WARUNG_DOMAIN, siteName:cfg.WARUNG_NAME }))}" class="download-thumb" loading="eager" fetchpriority="high" decoding="async" width="640" height="360"></picture>
</picture>
 <div class="download-info">
 <h1 class="download-title">${h(media.title)}</h1>
 <div class="download-meta">
 <span><i class="fas fa-video"></i> ${h(dna.dlVideoMeta)}</span>
 ${media.duration > 0 ? `<span><i class="fas fa-clock"></i> ${formatDuration(media.duration)}</span>` : ''}
 <span><i class="fas fa-eye"></i> ${formatViews(media.views || 0)} ${h(dna.viewerLabel)}</span>
 </div>
 </div>
 </div>
 <div class="download-section">
 <div class="download-section-title"><i class="fas fa-download"></i> ${h(dna.dlOptions)}</div>
 ${qualityOptions}
 </div>
 <p style="text-align:center;margin-top:16px"><a href="${h(canonical)}" class="btn btn-outline"><i class="fas fa-arrow-left"></i> ${h(dna.dlBackPage)}</a></p>`;

 } else if (type === 'album') {
 const albumResult = await client.getAlbum(id);
 const photos = albumResult?.data?.photos || [];

 const photoGrid = photos.length
 ? `<a href="${h(thumb)}" class="download-all-btn" target="_blank" rel="noopener noreferrer" download>
 <i class="fas fa-images"></i> ${h(dna.dlAllPhotos)} (${photos.length} ${h(dna.dlFotoCount)})
 </a>
 <div class="download-photo-grid">
 ${photos.map((photo, i) => `
 <div class="download-photo-item">
 <picture>
 <source srcset="${h((() => { try { const u=new URL(photo.url); u.searchParams.set('fm','webp'); u.searchParams.set('w','320'); return u.toString(); } catch { return photo.url+'?fm=webp&w=320'; } })())}" type="image/webp">
 <picture><source srcset="${h((() => { try { const u=new URL(photo.url); u.searchParams.set('fm','webp'); u.searchParams.set('w','320'); return u.toString(); } catch { return photo.url+(photo.url.includes('?')?'&':'?')+'fm=webp&w=320'; } })())}" type="image/webp"><img src="${h(photo.url)}" alt="${h(_altText(media, { context:'album', domain:cfg.WARUNG_DOMAIN, siteName:cfg.WARUNG_NAME, photoIndex:i }))}" loading="${i < 8 ? 'eager' : 'lazy'}" decoding="async" width="320" height="320" style="aspect-ratio:1;width:100%;height:auto"></picture>
</picture>
 <div class="download-photo-overlay">
 <a href="${h(photo.url)}" download target="_blank" rel="noopener noreferrer" aria-label="${h(dna.dlPageVerb)} foto ${i + 1}"><i class="fas fa-download"></i></a>
 </div>
 </div>`).join('')}
 </div>`
 : `<div class="download-error"><i class="fas fa-exclamation-circle"></i> ${h(dna.dlFotoEmpty)}</div>`;

 bodyHtml = `
 <div class="download-hero">
 <picture>
 <source srcset="${h((() => { try { const u=new URL(thumb); u.searchParams.set('fm','webp'); u.searchParams.set('w','640'); return u.toString(); } catch { return thumb+'?fm=webp&w=640'; } })())}" type="image/webp">
 <picture><source srcset="${h((() => { try { const u=new URL(thumb); u.searchParams.set('fm','webp'); u.searchParams.set('w','640'); return u.toString(); } catch { return thumb+(thumb.includes('?')?'&':'?')+'fm=webp&w=640'; } })())}" type="image/webp"><img src="${h(thumb)}" alt="${h(media.title)}" class="download-thumb" loading="eager" fetchpriority="high" decoding="async" width="640" height="360"></picture>
</picture>
 <div class="download-info">
 <h1 class="download-title">${h(media.title)}</h1>
 <div class="download-meta">
 <span><i class="fas fa-images"></i> ${h(dna.dlAlbumMeta)}</span>
 <span><i class="fas fa-photo-video"></i> ${photos.length} ${h(dna.dlFotoCount)}</span>
 </div>
 </div>
 </div>
 <div class="download-section">
 <div class="download-section-title"><i class="fas fa-download"></i> ${h(dna.dlPhotosSect)}</div>
 ${photoGrid}
 </div>
 <p style="text-align:center;margin-top:16px"><a href="${h(canonical)}" class="btn btn-outline"><i class="fas fa-arrow-left"></i> ${h(dna.dlBackAlbum)}</a></p>`;
 } else {

 bodyHtml = `<div class="download-error" style="text-align:center;padding:40px 20px">
 <i class="fas fa-exclamation-triangle" style="font-size:2rem;color:var(--gold);display:block;margin-bottom:12px"></i>
 <p>${h(dna.dlNoType)}</p>
 <a href="${h(canonical)}" class="btn btn-outline" style="margin-top:12px"><i class="fas fa-arrow-left"></i> ${h(dna.dlBackBtn)}</a>
 </div>`;
 }

 const main = `<main id="${dna.ids.mainContent}"><div class="download-wrap">${bodyHtml}</div></main>`;
 return new Response(head + nav + main + renderFooter(cfg, request, adNonce), {
 status: 200,
 headers: htmlHeaders(cfg, 'article'),
 });
}

async function handleSearch(request, cfg, client, seo) {
 const dna = SiteDNA.get(cfg.WARUNG_DOMAIN);
 const url=new URL(request.url);
 const q=(url.searchParams.get('q')||'').trim().slice(0,100);
 const type=getContentTypes(cfg).includes(url.searchParams.get('type')||'')?url.searchParams.get('type'):'';
 const page=Math.max(1, safeParseInt(url.searchParams.get('page'), 1));
 let items=[], pagination={}, total=0, errorMsg='';

 // PASF: record query ke ring buffer — O(1), nol I/O, nol blocking
 if (q.length >= 2) pasfRecordQuery(cfg.WARUNG_DOMAIN, q);

 const [_searchRes, _trendRes2] = await Promise.allSettled([
 q.length >= 2
 ? client.search(q, { page, per_page: cfg.ITEMS_PER_PAGE, ...(type ? { type } : {}) }).catch(err => {
 if (cfg.DAPUR_DEBUG) console.error('Search error:', err.message);
 return { status: 'error', message: dna.searchErrMsg };
 })
 : Promise.resolve(null),
 client.getTrending(8).catch(() => ({ data: [] })),
 ]);
 const searchResult = _searchRes.status === 'fulfilled' ? _searchRes.value : null;
 const trendingResult = _trendRes2.status === 'fulfilled' ? _trendRes2.value : { data: [] };
 const trending = trendingResult?.data || [];
 if (searchResult) {
 if (searchResult?.status === 'error') errorMsg = searchResult.message || 'Pencarian gagal.';
 else { items = searchResult?.data || []; pagination = searchResult?.meta?.pagination || searchResult?.meta || {}; total = pagination.total || 0; }
 }
 const pageTitle=dna.searchPageTitleFn(q,page,cfg.WARUNG_NAME);
 const pageDesc=dna.searchPageDescFn(q,total,cfg.WARUNG_NAME);
 const canonical=seo.canonical('/'+cfg.PATH_SEARCH+(q?'?q='+encodeURIComponent(q):''),request);
 const adNonce=generateNonce();
 const paginationTotal=pagination.total_pages||Math.ceil(total/cfg.ITEMS_PER_PAGE)||1;
 const prevUrl=q&&page>1?seo.canonical('/'+cfg.PATH_SEARCH+'?q='+encodeURIComponent(q)+(page>2?'&page='+(page-1):'')):null;
 const nextUrl=q&&page<paginationTotal?seo.canonical('/'+cfg.PATH_SEARCH+'?q='+encodeURIComponent(q)+'&page='+(page+1)):null;
 const searchKeywords=q?q+', '+cfg.SEO_KEYWORDS:cfg.SEO_KEYWORDS;
 const searchBcSchema=seo.breadcrumbSchema([{name:dna.berandaLabel,url:'/'},{name:dna.searchLabel,url:null}],'/'+cfg.PATH_SEARCH);
 const searchResultsSchema=q?`<script type="application/ld+json" nonce="${generateNonce()}">${JSON.stringify({'@context':'https://schema.org','@type':'SearchResultsPage','@id':canonical,'url':canonical,'name':pageTitle,'description':pageDesc,'inLanguage':cfg.SEO_LANG||'id','isPartOf':{'@type':'WebSite','name':cfg.WARUNG_NAME,'url':'https://'+cfg.WARUNG_DOMAIN}})}</script>`:'';
 const searchExtraHead=(q&&items.length?seo.itemListSchema(items,canonical,cfg):'')+searchBcSchema+searchResultsSchema;
 const head=renderHead({ title:pageTitle, desc:pageDesc, canonical, ogImage:cfg.SEO_OG_IMAGE, ogType:'website', noindex:!q||(page>1&&!items.length), keywords:searchKeywords, cfg, seo, request, extraHead:searchExtraHead, prevUrl, nextUrl, isPagePaginated:page>1, extraNonces:[adNonce] });
 const nav=renderNavHeader({ cfg, currentPage:'search', q });
 const filterUrl=(t,pg=1)=>{const p={};if(q)p.q=q;if(t)p.type=t;if(pg>1)p.page=pg;return '/'+cfg.PATH_SEARCH+'?'+new URLSearchParams(p).toString();};
 const filterTabs=q?`<div class="filter-tabs"><a href="${filterUrl('')}" class="filter-tab ${!type?'active':''}">${h(dna.tabSemua)}</a>${getContentTypes(cfg).map(t=>{const meta=TYPE_META[t]||{icon:'fa-file'};return `<a href="${filterUrl(t)}" class="filter-tab ${type===t?'active':''}"><i class="fas ${meta.icon}"></i> ${ucfirst(t)}</a>`;}).join('')}</div>`:'';
 const pageHeader=`<div class="${dna.cls.pageHeader}"><div class="${dna.cls.container}">
<div class="page-label"><i class="fas fa-search"></i> ${dna.searchLabel}</div>
<h1 class="${dna.cls.pageTitle}">${q?`Hasil untuk <em>"${h(mbSubstr(q,0,50))}"</em>`:h(dna.footerLinkSearch)}</h1>
<form class="search-bar-large" role="search" action="/${h(cfg.PATH_SEARCH)}" method="get">
 <div class="search-bar">
 <label for="search-main-input" class="sr-only">${h(dna.ariaSearchLabel)}</label>
 <input id="search-main-input" type="search" name="q" value="${h(q)}" placeholder="${h(dna.searchInputPH)}" autocomplete="off" autofocus maxlength="100">
 ${type?`<input type="hidden" name="type" value="${h(type)}">`:''}
 <button type="submit" aria-label="${h(dna.ariaSearchBtn)}"><i class="fas fa-search"></i></button>
 </div>
</form>
${filterTabs}
</div></div>`;
 let contentSection='';
 if (!q) contentSection=`<div class="${dna.cls.noResults}"><div class="no-results-icon"><i class="fas fa-search"></i></div><h2>${h(dna.searchEmptyMsg)}</h2><p>${h(dna.searchEmptyTip)}</p></div>`;
 else if (errorMsg) contentSection=`<div class="${dna.cls.noResults}"><div class="no-results-icon"><i class="fas fa-exclamation-triangle"></i></div><h2>${h(dna.searchFailed)}</h2><p>${h(errorMsg)}</p></div>`;
 else if (!items.length) contentSection=`<div class="${dna.cls.noResults}"><div class="no-results-icon"><i class="fas fa-folder-open"></i></div><h2>${h(dna.searchNoResult)} "${h(q)}"</h2><p>${h(dna.searchTryOther)}</p>${type?`<div class="no-results-actions"><a href="${filterUrl('')}" class="btn btn-outline">Hapus filter</a></div>`:''}</div>`;
 else {
 const from=(page-1)*cfg.ITEMS_PER_PAGE+1, to=Math.min(page*cfg.ITEMS_PER_PAGE,total);
 contentSection=`<div class="search-stats"><i class="fas fa-layer-group"></i> ${dna.searchStatsTpl(from,to,total)}</div>`
 +renderBanner('before_grid',cfg,request,adNonce)+renderGrid(items,cfg,true,request,adNonce)+renderBanner('after_grid',cfg,request,adNonce)+renderPagination(pagination, p=>filterUrl(type,p), cfg);
 }
 const allTags={};
 items.forEach(item=>(item.tags||[]).forEach(t=>{allTags[t]=(allTags[t]||0)+1;}));
 const topTags=Object.entries(allTags).sort((a,b)=>b[1]-a[1]).slice(0,20).map(([t])=>t);
 const tagsHtml=topTags.length?`<div class="${dna.cls.tagCloud}" style="margin:14px 0">${topTags.map(t=>`<a href="${h(tagUrl(t,cfg))}" class="${dna.cls.tag}">#${h(t)}</a>`).join('')}</div>`:'';
 // PASF di search page — ambil query terkait dengan q yang baru dicari.
 // Berguna terutama saat hasil kosong: kasih user arah query alternatif.
 // Exclude q itu sendiri agar tidak muncul query yang sama di widget.
 const _pasfSearchQueries = q.length >= 2
  ? pasfGetRelated(cfg.WARUNG_DOMAIN, q, cfg).filter(s => s.toLowerCase() !== q.toLowerCase())
  : [];
 const pasfSearchHtml = _pasfSearchQueries.length
  ? pasfRenderWidget(_pasfSearchQueries, cfg).replace(
     'Pencarian Terkait',
     items.length ? 'Pencarian Terkait' : 'Coba Juga'
    )
  : '';
 const main=`${pageHeader}<main id="${dna.ids.mainContent}"><div class="${dna.cls.container}"><div class="${dna.cls.layoutMain}">
<section class="${dna.cls.contentArea}">${contentSection}${tagsHtml}${pasfSearchHtml}</section>
</div></div></main>`;
 const popunderSearch = renderBanner('footer_popunder', cfg, request, adNonce);
 return new Response(head+nav+main+renderFooter(cfg,request,adNonce)+popunderSearch, { status:200, headers:htmlHeaders(cfg,'search') });
}

async function handleTagIndex(request, cfg, client, seo) {
 const dna = SiteDNA.get(cfg.WARUNG_DOMAIN);

 let tagMap = {};
 try {
 const [trendRes, recentRes] = await Promise.all([
 client.getTrending(50).catch(() => ({ data: [] })),
 client.getMediaList({ per_page: 50, sort: 'newest' }).catch(() => ({ data: [] })),
 ]);
 const allItems = [...(trendRes?.data || []), ...(recentRes?.data || [])];
 for (const item of allItems) {
 for (const t of (item.tags || [])) {
 if (typeof t === 'string' && t.trim()) {
 tagMap[t.trim()] = (tagMap[t.trim()] || 0) + 1;
 }
 }
 }
 } catch(e) { }

 const tags = Object.entries(tagMap).sort((a, b) => a[0].localeCompare(b[0], 'id'));

 const canonical = seo.canonical('/' + cfg.PATH_TAG);
 const pageTitle = `${dna.tagIndexTitle} | ${cfg.WARUNG_NAME}`;
 const pageDesc = dna.tagIndexDesc(cfg.WARUNG_NAME);
 const nonce = generateNonce();

 const breadcrumbSchema = JSON.stringify({
 '@context': 'https://schema.org', '@type': 'BreadcrumbList',
 itemListElement: [
 { '@type': 'ListItem', position: 1, name: cfg.WARUNG_NAME, item: 'https://' + cfg.WARUNG_DOMAIN + '/' },
 { '@type': 'ListItem', position: 2, name: dna.tagBreadLabel, item: canonical },
 ],
 });

 const head = renderHead({
 title: pageTitle, desc: pageDesc, canonical,
 ogImage: cfg.SEO_OG_IMAGE, ogType: 'website',
 keywords: dna.tagBreadLabel+', tag, '+cfg.SEO_KEYWORDS,
 noindex: false, cfg, seo, request,
 extraHead: `<script type="application/ld+json" nonce="${nonce}">${breadcrumbSchema}</script>`,
 extraNonces: [nonce],
 });
 const nav = renderNavHeader({ cfg });
 const breadcrumbHtml = renderBreadcrumb([{ name: dna.berandaLabel, url: homeUrl(cfg) }, { name: dna.tagBreadLabel, url: null }], cfg);

 const tagCloud = tags.length
 ? tags.map(([name, count]) =>
 `<a href="/${cfg.PATH_TAG}/${encodeURIComponent(name.toLowerCase())}" class="${dna.cls.tag}" style="font-size:.9rem;padding:.4rem .85rem">`
 + `${h(name)}<span style="opacity:.55;font-size:.78em;margin-left:.35em">(${count})</span>`
 + `</a>`
 ).join('\n')
 : `<p style="color:var(--text-dim)">${h(dna.tagNoAvail)}</p>`;

 const body = `
<main id="${dna.ids.mainContent}">
 <div class="${dna.cls.container}" style="padding-top:2rem;padding-bottom:3rem">
 ${breadcrumbHtml}
 <div class="${dna.cls.pageHeader}">
 <h1 class="${dna.cls.pageTitle}"><i class="fas fa-tags" style="margin-right:.5rem"></i>${h(dna.tagIndexTitle)}</h1>
 <p class="${dna.cls.pageDesc}">${tags.length ? dna.tagCountTpl(tags.length, h(cfg.WARUNG_NAME)) : ''}</p>
 </div>
 <div class="${dna.cls.tagCloud}" style="margin-top:1.5rem;display:flex;flex-wrap:wrap;gap:.5rem">
 ${tagCloud}
 </div>
 </div>
</main>`;

 return new Response(head + nav + body + renderFooter(cfg, request, nonce), {
 status: 200,
 headers: htmlHeaders(cfg, 'list'),
 });
}

async function handleTag(request, cfg, client, seo, segments) {
 const dna = SiteDNA.get(cfg.WARUNG_DOMAIN);
 const tagRaw=decodeURIComponent(segments[1]||'');
 const tag=mbSubstr(
 (tagRaw).trim()
 .replace(/<[^>]+>/g,'') // strip HTML tags
 .replace(/[<>"'`]/g,'') // strip dangerous quote/bracket chars
 .replace(/on\w+\s*=/gi,''), // strip event handler attributes (onclick= etc)
 0, 80);
 if (!tag) return handleTagIndex(request, cfg, client, seo);
 const url=new URL(request.url);
 const page=Math.max(1, safeParseInt(url.searchParams.get('page'), 1));
 const type=getContentTypes(cfg).includes(url.searchParams.get('type')||'')?url.searchParams.get('type'):'';
 const params={page,per_page:cfg.ITEMS_PER_PAGE};
 if (type) params.type=type;
 // Parallelkan fetch tag + trending — hemat ~200-400ms TTFB
 const [_tagRes, _trendTagRes] = await Promise.allSettled([
 client.getByTag(tag,params),
 // OPT: trending hanya dipakai di sidebar — 8 items saja, skip pada page>1
 (page > 1 ? Promise.resolve({data:[]}) : client.getTrending(8).catch(()=>({data:[]}))),
 ]);
 const result=_tagRes.status==='fulfilled'?_tagRes.value:null;
 const items=result?.data||[], pagination=result?.meta?.pagination||result?.meta||{}, total=pagination.total||0;
 const errorMsg=result?.status==='error'?(result.message||'Gagal mengambil data tag.'):'';
 const typeCounts={};
 items.forEach(item=>{typeCounts[item.type]=(typeCounts[item.type]||0)+1;});
 const relatedTagsMap={};
 items.forEach(item=>(item.tags||[]).forEach(t=>{if(t.toLowerCase()!==tag.toLowerCase())relatedTagsMap[t]=(relatedTagsMap[t]||0)+1;}));
 const relatedTags=Object.entries(relatedTagsMap).sort((a,b)=>b[1]-a[1]).slice(0,20).map(([t])=>t);
 const pageTitle=dna.tagPageTitleFn(tag,page,cfg.WARUNG_NAME);
 const _tagRelStr = relatedTags.slice(0,5).join(", ");
 const pageDesc=`Koleksi ${numberFormat(total)} konten "${tag}" streaming HD gratis di ${cfg.WARUNG_NAME}. Tonton tanpa daftar, update harian.${_tagRelStr ? " Lihat juga: "+_tagRelStr+"." : ""}`;
 const canonical=seo.canonical('/'+cfg.PATH_TAG+'/'+encodeURIComponent(tag.toLowerCase()));
 const tagExtraHead=seo.collectionPageSchema('#'+tag,items,canonical,cfg)
 +seo.breadcrumbSchema([{name:dna.berandaLabel,url:'/'},{name:dna.tagBreadLabel,url:'/'+cfg.PATH_TAG},{name:'#'+tag,url:null}],'/'+cfg.PATH_TAG+'/'+encodeURIComponent(tag.toLowerCase()))
 +(items.length?seo.itemListSchema(items,canonical,cfg):'');
 const tagKeywords=tag+', '+tag+' terbaru, nonton '+tag+', '+cfg.SEO_KEYWORDS;
 const tagFilterUrl=(t,p=1)=>{const base='/'+cfg.PATH_TAG+'/'+encodeURIComponent(tag);const ps={};if(t)ps.type=t;if(p>1)ps.page=p;return base+(Object.keys(ps).length?'?'+new URLSearchParams(ps).toString():'');};
 const totalPages = pagination.total_pages||pagination.last_page||pagination.pageCount||1;
 const prevUrl = page > 1 ? seo.canonical(tagFilterUrl(type, page-1)) : null;
 const nextUrl = page < totalPages ? seo.canonical(tagFilterUrl(type, page+1)) : null;
 const adNonce=generateNonce();
 const head=renderHead({ title:pageTitle, desc:pageDesc, canonical, ogImage:items[0]?.thumbnail||cfg.SEO_OG_IMAGE, ogType:'website', noindex:page>5||(items.length<3&&page>1), keywords:tagKeywords, cfg, seo, request, extraHead:tagExtraHead, prevUrl, nextUrl, extraNonces:[adNonce] });
 const nav=renderNavHeader({cfg});
 const fromN=(page-1)*cfg.ITEMS_PER_PAGE+1, toN=Math.min(page*cfg.ITEMS_PER_PAGE,total);
 const filterTabs=total>0&&Object.keys(typeCounts).length?`<div class="filter-tabs"><a href="${tagFilterUrl('')}" class="filter-tab ${!type?'active':''}">${h(dna.tabSemua)}</a>${Object.entries(typeCounts).map(([t,c])=>`<a href="${tagFilterUrl(t)}" class="filter-tab ${type===t?'active':''}"><i class="fas ${TYPE_ICONS[t]||'fa-file'}"></i> ${ucfirst(t)} (${c})</a>`).join('')}</div>`:'';
 const breadcrumbHtml=renderBreadcrumb([{name:dna.berandaLabel,url:homeUrl(cfg)},{name:dna.tagBreadLabel,url:'/'+cfg.PATH_TAG},{name:'#'+tag,url:null}],cfg);
 const tagHeader=`<div class="tag-header"><div class="${dna.cls.container}">${breadcrumbHtml}
<h1 class="tag-hero"><i class="fas fa-tag" aria-hidden="true"></i><span>#${h(tag)}</span>${total>0?` <small style="font-weight:400;font-size:.55em;opacity:.6">(${numberFormat(total)})</small>`:""}</h1>
<p class="${dna.cls.pageDesc}">${total>0?dna.tagCountTpl_(fromN,toN,total):h(dna.tagNoContent)}</p>
${filterTabs}</div></div>`;

 if (!items.length && !errorMsg) return handle404(cfg, seo, request);

 let contentSection='';
 if (errorMsg) contentSection=`<div class="${dna.cls.noResults}"><div class="no-results-icon"><i class="fas fa-exclamation-triangle"></i></div><h2>${h(dna.errorGenericTitle)}</h2><p>${h(errorMsg)}</p><div class="no-results-actions"><a href="${homeUrl(cfg)}" class="btn btn-outline"><i class="fas fa-home"></i> ${h(dna.errBackHome)}</a></div></div>`;
 else {
 const _refQTag = extractSearchQuery(request.headers.get('Referer') || '');
 const _tagItems = (_refQTag && page === 1)
 ? seededShuffle([...items], hashSeed(dna.gridShuffleSalt + ':tag:' + _refQTag.toLowerCase().slice(0, 40)))
 : items;
 contentSection=renderBanner('before_grid',cfg,request,adNonce)+renderGrid(_tagItems,cfg,true,request,adNonce)+renderBanner('after_grid',cfg,request,adNonce)+renderPagination(pagination, p=>tagFilterUrl(type,p), cfg);
 }
 const _tagIntroTpls = [
  `Temukan ${numberFormat(total)} konten "${h(tag)}" gratis streaming HD di ${h(cfg.WARUNG_NAME)}. Tonton tanpa daftar, update setiap hari.`,
  `Koleksi "${h(tag)}" terlengkap — ${numberFormat(total)} konten gratis tersedia. Kualitas HD, tanpa registrasi di ${h(cfg.WARUNG_NAME)}.`,
  `${numberFormat(total)} konten "${h(tag)}" siap ditonton gratis. Streaming HD, update harian di ${h(cfg.WARUNG_NAME)}.`,
 ];
 const _tagIntro = (page===1&&total>0) ? `<p class="tag-intro" style="font-size:.82rem;color:var(--text-dim);line-height:1.6;padding:4px 0 10px">${_tagIntroTpls[hashSeed(cfg.WARUNG_DOMAIN+":"+tag+":ti")%3]}${relatedTags.length ? " Topik terkait: "+relatedTags.slice(0,4).map(t=>h(t)).join(", ")+"." : ""}</p>` : "";
 const main=`${tagHeader}<main id="${dna.ids.mainContent}"><div class="${dna.cls.container}"><div class="${dna.cls.layoutMain}">
<section class="${dna.cls.contentArea}">${_tagIntro}${contentSection}</section>
</div></div></main>`;
 const popunderTag = renderBanner('footer_popunder', cfg, request, adNonce);
 return new Response(head+nav+main+renderFooter(cfg,request,adNonce)+popunderTag, { status:200, headers:htmlHeaders(cfg,'list') });
}

async function handleCategory(request, cfg, client, seo, segments) {
 const dna = SiteDNA.get(cfg.WARUNG_DOMAIN);
 const type=(segments[1]||'').toLowerCase().replace(/[^a-z]/g,'');
 const validTypes=getContentTypes(cfg);
 if (!validTypes.includes(type)) return handle404(cfg,seo,request);
 const url=new URL(request.url);
 const page=Math.max(1, safeParseInt(url.searchParams.get('page') || segments[2], 1));
 const [_mediaRes2, _trendRes3]=await Promise.allSettled([
 client.getMediaList({page,per_page:cfg.ITEMS_PER_PAGE,type,sort:'newest'}),
 // OPT: skip trending pada page>1 — tidak ditampilkan di paginasi
 (page > 1 ? Promise.resolve({data:[]}) : client.getTrending(cfg.TRENDING_COUNT,type)),
 ]);
 const mediaResult = _mediaRes2.status === 'fulfilled' ? _mediaRes2.value : null;
 const trendingResult= _trendRes3.status === 'fulfilled' ? _trendRes3.value : null;
 const trending=trendingResult?.data||[];
 const items=mediaResult?.data||[], pagination=mediaResult?.meta?.pagination||mediaResult?.meta||{};
 const typeLabel={video:'Video',album:'Album'}[type]||ucfirst(type);
 const typeIcon={video:'fa-video',album:'fa-images'}[type]||'fa-file';
 const pageTitle=dna.catPageTitleFn(typeLabel,page,cfg.WARUNG_NAME);
 const pageDesc=dna.catDescTpl(typeLabel.toLowerCase(), cfg.WARUNG_NAME, pagination.total||0);
 const canonical=seo.canonical('/'+cfg.PATH_CATEGORY+'/'+type+(page>1?'/'+page:''));
 const prevUrl=page>1?seo.canonical('/'+cfg.PATH_CATEGORY+'/'+type+(page>2?'/'+(page-1):'')):null;
 const nextUrl=pagination.has_next?seo.canonical('/'+cfg.PATH_CATEGORY+'/'+type+'/'+(page+1)):null;
 const extraHead=seo.collectionPageSchema(typeLabel,items,canonical,cfg)+seo.itemListSchema(items,canonical,cfg)+seo.breadcrumbSchema([{name:dna.berandaLabel,url:'/'},{name:typeLabel,url:null}],'/'+cfg.PATH_CATEGORY+'/'+type);
 const catKeywords=typeLabel+', '+type+' gratis, '+type+' terbaru, '+cfg.SEO_KEYWORDS;
 const adNonce=generateNonce();
 const head=renderHead({ title:pageTitle, desc:pageDesc, canonical, ogImage:items[0]?.thumbnail||cfg.SEO_OG_IMAGE, ogType:'website', noindex:page>3&&!items.length, keywords:catKeywords, cfg, seo, request, extraHead, prevUrl, nextUrl, extraNonces:[adNonce] });
 const nav=renderNavHeader({cfg});
 const breadcrumbHtml=renderBreadcrumb([{name:dna.berandaLabel,url:homeUrl(cfg)},{name:typeLabel,url:null}],cfg);
 const pageHeader=`<div class="${dna.cls.pageHeader}"><div class="${dna.cls.container}">
${breadcrumbHtml}
<div class="page-label"><i class="fas ${typeIcon}"></i> ${h(dna.katLabel)}</div>
<h1 class="${dna.cls.pageTitle}">${h(typeLabel)} <span class="h1-sub">${["Gratis HD","Streaming Gratis","Koleksi Terbaru","Terlengkap HD","Full HD Gratis"][hashSeed(cfg.WARUNG_DOMAIN+":"+type+":ch")%5]}</span></h1>
${pagination.total?`<p class="${dna.cls.pageDesc}">${h(dna.katCountTpl(pagination.total, typeLabel, page))}</p>`:''}
</div></div>`;
 let contentSection='';
 if (!items.length) contentSection=`<div class="empty-state"><i class="fas fa-folder-open"></i><p>${h(dna.katEmptyTpl(typeLabel.toLowerCase()))}</p></div>`;
 else {
 const _refQCat = extractSearchQuery(request.headers.get('Referer') || '');
 const _catItems = (_refQCat && page === 1)
 ? seededShuffle([...items], hashSeed(dna.gridShuffleSalt + ':cat:' + _refQCat.toLowerCase().slice(0, 40)))
 : items;
 contentSection=renderBanner('before_grid',cfg,request,adNonce)+renderGrid(_catItems,cfg,true,request,adNonce)+renderBanner('after_grid',cfg,request,adNonce)+renderPagination(pagination, p=>'/'+cfg.PATH_CATEGORY+'/'+type+(p>1?'/'+p:''), cfg);
 }
 const _catTotal = pagination.total ? numberFormat(pagination.total)+' '+typeLabel.toLowerCase() : typeLabel.toLowerCase();
 const _catTrend3 = trending.slice(0,3).map(i=>h(i._original_title||i.title||'')).filter(Boolean).join(', ');
 const _catIntroTpls = [
  `Temukan ${_catTotal} berkualitas HD di ${h(cfg.WARUNG_NAME)}. Streaming gratis, tanpa registrasi, update harian.`,
  `Koleksi ${_catTotal} terlengkap tersedia gratis. Tonton langsung di ${h(cfg.WARUNG_NAME)} tanpa download.`,
  `${_catTotal.charAt(0).toUpperCase()+_catTotal.slice(1)} pilihan siap ditonton gratis. Kualitas HD, streaming cepat di ${h(cfg.WARUNG_NAME)}.`,
 ];
 const _catIntro = page===1 ? `<p class="cat-intro" style="font-size:.82rem;color:var(--text-dim);line-height:1.6;padding:4px 0 10px">${_catIntroTpls[hashSeed(cfg.WARUNG_DOMAIN+":"+type+":ci")%3]}${_catTrend3 ? " Populer: "+_catTrend3+"." : ""}</p>` : "";
 const main=`${pageHeader}<main id="${dna.ids.mainContent}"><div class="${dna.cls.container}"><div class="${dna.cls.layoutMain}">
<section class="${dna.cls.contentArea}">${_catIntro}${contentSection}</section>
</div></div></main>`;
 const popunderCat = renderBanner('footer_popunder', cfg, request, adNonce);
 return new Response(head+nav+main+renderFooter(cfg,request,adNonce)+popunderCat, { status:200, headers:htmlHeaders(cfg,'list') });
}

async function handleStaticPage(cfg, seo, request, slug) {
 const dna = SiteDNA.get(cfg.WARUNG_DOMAIN);
 const env=cfg._env||{};
 const ev=(key,fallback)=>env[key]||cfg[key]||fallback;
 const faqData=[
 { q: dna.faqQ1, a: dna.faqA1 },
 { q: dna.faqQ2, a: `Kirim email ke ${cfg.CONTACT_EMAIL}.` },
 { q: dna.faqQ3, a: dna.faqA3 },
 ];
 const pages={
 [cfg.PATH_ABOUT.toLowerCase()]:{ title:ev('PAGE_ABOUT_TITLE','Tentang Kami'), icon:'fa-info-circle', desc:ev('PAGE_ABOUT_DESC','Tentang '+cfg.WARUNG_NAME), content:ev('PAGE_ABOUT_CONTENT',`<h2>Tentang ${h(cfg.WARUNG_NAME)}</h2><p>${h(cfg.WARUNG_NAME)} adalah platform streaming gratis yang hadir untuk memberikan pengalaman menonton terbaik. Akses ribuan konten video dan album tanpa registrasi, kapan saja dan di mana saja.</p><p>Kami berkomitmen untuk menyediakan konten berkualitas dengan kecepatan streaming optimal.</p>`) },
 [cfg.PATH_CONTACT.toLowerCase()]:{ title:ev('PAGE_CONTACT_TITLE','Hubungi Kami'), icon:'fa-envelope', desc:ev('PAGE_CONTACT_DESC','Kontak '+cfg.WARUNG_NAME), content:ev('PAGE_CONTACT_CONTENT',`<h2>Hubungi Kami</h2><p>Ada pertanyaan atau masukan? Kami siap membantu.</p><address><p><strong>Email:</strong> <a href="mailto:${h(cfg.CONTACT_EMAIL)}">${h(cfg.CONTACT_EMAIL)}</a></p><p><strong>Nama:</strong> ${h(cfg.CONTACT_EMAIL_NAME)}</p></address>`) },
 [cfg.PATH_FAQ.toLowerCase()]:{ title:ev('PAGE_FAQ_TITLE','FAQ'), icon:'fa-question-circle', desc:ev('PAGE_FAQ_DESC','Pertanyaan yang sering diajukan tentang '+cfg.WARUNG_NAME), content:ev('PAGE_FAQ_CONTENT',`<h2>Pertanyaan Umum</h2><div class="faq-list"><details><summary>${h(dna.faqQ1)}</summary><p>${h(dna.faqA1)}</p></details><details><summary>${h(dna.faqQ2)}</summary><p>Kirim email ke <a href="mailto:${h(cfg.CONTACT_EMAIL)}">${h(cfg.CONTACT_EMAIL)}</a></p></details><details><summary>${h(dna.faqQ3)}</summary><p>${h(dna.faqA3)}</p></details></div>`), schema:seo.faqSchema(faqData) },
 [cfg.PATH_TERMS.toLowerCase()]:{ title:ev('PAGE_TERMS_TITLE','Syarat & Ketentuan'), icon:'fa-file-contract', desc:ev('PAGE_TERMS_DESC','Syarat dan Ketentuan penggunaan '+cfg.WARUNG_NAME), content:ev('PAGE_TERMS_CONTENT',`<h2>Syarat &amp; Ketentuan</h2><p>Dengan menggunakan ${h(cfg.WARUNG_NAME)}, Anda setuju:</p><ul><li>Konten hanya untuk penggunaan pribadi dan non-komersial.</li><li>Dilarang mendistribusikan ulang tanpa izin tertulis.</li><li>Pengguna bertanggung jawab atas penggunaan layanan.</li></ul><p>Terakhir diperbarui: ${new Date().toLocaleDateString('id-ID',{year:'numeric',month:'long'})}</p>`) },
 [cfg.PATH_PRIVACY.toLowerCase()]:{ title:ev('PAGE_PRIVACY_TITLE','Kebijakan Privasi'), icon:'fa-lock', desc:ev('PAGE_PRIVACY_DESC','Kebijakan Privasi '+cfg.WARUNG_NAME), content:ev('PAGE_PRIVACY_CONTENT',`<h2>Kebijakan Privasi</h2><p>Kami menghargai privasi Anda:</p><ul><li>Kami mengumpulkan data anonim untuk meningkatkan layanan.</li><li>Kami tidak menjual data pribadi kepada pihak ketiga.</li><li>Cookie digunakan untuk meningkatkan pengalaman browsing.</li></ul><p>Pertanyaan: <a href="mailto:${h(cfg.CONTACT_EMAIL)}">${h(cfg.CONTACT_EMAIL)}</a></p><p>Terakhir diperbarui: ${new Date().toLocaleDateString('id-ID',{year:'numeric',month:'long'})}</p>`) },
 [cfg.PATH_DMCA.toLowerCase()]:{ title:ev('PAGE_DMCA_TITLE','Kebijakan DMCA'), icon:'fa-copyright', desc:ev('PAGE_DMCA_DESC','Kebijakan DMCA '+cfg.WARUNG_NAME), content:ev('PAGE_DMCA_CONTENT',`<h2>Kebijakan DMCA</h2><p>${h(cfg.WARUNG_NAME)} menghormati hak kekayaan intelektual. Kirim laporan ke:</p><address><p><strong>Email:</strong> <a href="mailto:${h(cfg.CONTACT_EMAIL)}">${h(cfg.CONTACT_EMAIL)}</a></p></address><p>Laporan harus menyertakan: identifikasi karya, URL konten, informasi kontak Anda, dan pernyataan keakuratan informasi.</p><p>Kami merespons dalam <strong>3 hari kerja</strong>.</p>`) },
 };
 const page=pages[slug];
 if (!page) return handle404(cfg,seo,request);
 const canonical=seo.canonical('/'+slug);
 const pageMetaTitle=page.title+' | '+cfg.WARUNG_NAME;
 const footNonce=generateNonce();
 const extraHead=(page.schema||'')+seo.breadcrumbSchema([{name:dna.berandaLabel,url:'/'},{name:page.title,url:null}],'/'+slug);
 const staticKeywords=page.title+', '+cfg.WARUNG_NAME+', '+cfg.SEO_KEYWORDS;
 const head=renderHead({ title:pageMetaTitle, desc:page.desc, canonical, ogImage:cfg.SEO_OG_IMAGE, ogType:'website', noindex:false, keywords:staticKeywords, cfg, seo, request, extraHead, extraNonces:[footNonce] });
 const nav=renderNavHeader({cfg});
 const breadcrumbHtml=renderBreadcrumb([{name:dna.berandaLabel,url:homeUrl(cfg)},{name:page.title,url:null}],cfg);
 const body=`<main id="${dna.ids.mainContent}" class="${dna.cls.container}" style="padding-top:2rem;padding-bottom:3rem">
${breadcrumbHtml}
<article style="max-width:800px;margin:0 auto;background:var(--bg-card,#1e222b);border-radius:var(--border-radius,8px);padding:2rem 2.5rem;box-shadow:var(--shadow-sm)">
 <header>
 <p class="page-label"><i class="fas ${h(page.icon)}"></i> ${h(page.title)}</p>
 <h1 style="font-size:1.6rem;font-weight:700;margin:.5rem 0 1.2rem;line-height:1.3">${h(page.title)}</h1>
 </header>
 <div class="static-content" style="line-height:1.8;color:var(--text-color)">${page.content}</div>
</article>
</main>`;
 return new Response(head+nav+body+renderFooter(cfg,request,footNonce), { status:200, headers:htmlHeaders(cfg,'page') });
}

async function handleSitemap(request, cfg, client, env, honeyPrefix, cannibal=null) {
 const ua  = request.headers.get('User-Agent') || '';
 const isGoogle = ua.includes('Googlebot') || ua.includes('Google-InspectionTool');
 const url = new URL(request.url);
 const stype = url.searchParams.get('type') || ''; // main|video|album|tag

 // Non-Googlebot → fake honeypot sitemap agar struktur asli tersembunyi
 if (!isGoogle) {
  const phase = getMoonPhase();
  const salt  = env.SITEMAP_SALT || _DEFAULT_CONFIG.SITEMAP_SALT || cfg.WARUNG_DOMAIN;
  const seed  = hashSeed(salt + ':' + phase + ':' + new Date().getUTCHours());
  const base  = 'https://' + cfg.WARUNG_DOMAIN;
  const fakes = seededShuffle(
   Array.from({length:50},(_,i) => hexHash(cfg.WARUNG_DOMAIN+':fake:'+i,8))
        .map(id => ({loc:base+'/'+(honeyPrefix||'trap')+'/'+id,chf:'hourly',pri:'0.9'})),
   seed
  );
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`
   + fakes.map(u=>`<url><loc>${h(u.loc)}</loc><changefreq>${u.chf}</changefreq><priority>${u.pri}</priority></url>`).join('\n')
   + `\n</urlset>`;
  return new Response(xml,{status:200,headers:{'Content-Type':'application/xml; charset=UTF-8','Cache-Control':'public, max-age=3600'}});
 }

 const base  = 'https://' + cfg.WARUNG_DOMAIN;
 const today = new Date().toISOString().slice(0,10);
 const MAX   = 4500;
 const CC    = 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400';

 // ── Sitemap Index (/sitemap.xml tanpa ?type) ─────────────────────────────────
 if (!stype) {
  const entries = [
   {loc: base+'/sitemap.xml?type=main',  lastmod: today},
   {loc: base+'/sitemap.xml?type=video', lastmod: today},
   {loc: base+'/sitemap.xml?type=album', lastmod: today},
   {loc: base+'/sitemap.xml?type=tag',   lastmod: today},
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`
   + entries.map(e=>`<sitemap>\n  <loc>${h(e.loc)}</loc>\n  <lastmod>${h(e.lastmod)}</lastmod>\n</sitemap>`).join('\n')
   + `\n</sitemapindex>`;
  return new Response(xml,{status:200,headers:{'Content-Type':'application/xml; charset=UTF-8','Cache-Control':CC}});
 }

 // ── Sitemap Tag (/sitemap.xml?type=tag) ──────────────────────────────────────
 if (stype === 'tag') {
  let tagUrls = [{loc:base+'/'+cfg.PATH_TAG, changefreq:'daily', priority:'0.8', lastmod:today}];
  try {
   const tagsRes = await client.getTags(500).catch(()=>({data:[]}));
   const tagList = tagsRes?.data || [];
   if (tagList.length) {
    tagList.forEach(tag => {
     const name = typeof tag === 'string' ? tag : (tag?.name || tag?.tag || '');
     if (!name) return;
     tagUrls.push({loc:base+'/'+cfg.PATH_TAG+'/'+encodeURIComponent(name.toLowerCase()), changefreq:'weekly', priority:'0.7', lastmod:today});
    });
   } else {
    // fallback: ekstrak tag dari item trending/newest
    const [tr,rr] = await Promise.allSettled([client.getTrending(100), client.getMediaList({per_page:100,sort:'newest'})]);
    const items = [...((tr.status==='fulfilled'?tr.value?.data:null)||[]),...((rr.status==='fulfilled'?rr.value?.data:null)||[])];
    const tagSet = new Set();
    items.forEach(item=>(item?.tags||[]).forEach(t=>{if(t&&typeof t==='string')tagSet.add(t.trim().toLowerCase());}));
    tagSet.forEach(t=>tagUrls.push({loc:base+'/'+cfg.PATH_TAG+'/'+encodeURIComponent(t), changefreq:'weekly', priority:'0.7', lastmod:today}));
   }
  } catch(e){ if(cfg.DAPUR_DEBUG) console.error('Sitemap tag:',e.message); }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`
   + tagUrls.slice(0,MAX).map(u=>`<url><loc>${h(u.loc)}</loc><lastmod>${h(u.lastmod)}</lastmod><changefreq>${h(u.changefreq)}</changefreq><priority>${h(u.priority)}</priority></url>`).join('\n')
   + `\n</urlset>`;
  return new Response(xml,{status:200,headers:{'Content-Type':'application/xml; charset=UTF-8','Cache-Control':CC}});
 }

 // ── Sitemap Main (/sitemap.xml?type=main) ────────────────────────────────────
 if (stype === 'main') {
  const urls = [
   {loc:base+'/',                          changefreq:'daily',   priority:'1.0', lastmod:today},
   {loc:base+'/'+cfg.PATH_SEARCH,          changefreq:'weekly',  priority:'0.5'},
   ...getContentTypes(cfg).map(t=>({loc:base+'/'+cfg.PATH_CATEGORY+'/'+t, changefreq:'daily', priority:'0.9', lastmod:today})),
  ];
  [cfg.PATH_ABOUT,cfg.PATH_CONTACT,cfg.PATH_FAQ,cfg.PATH_DMCA,cfg.PATH_TERMS,cfg.PATH_PRIVACY].forEach(slug=>{
   urls.push({loc:base+'/'+slug, changefreq:'monthly', priority:'0.6', lastmod:today});
  });
  urls.push({loc:base+'/profile', changefreq:'monthly', priority:'0.5', lastmod:today});
  if (cannibal) cannibal.getAllUrls().forEach(u=>urls.push({loc:u, changefreq:'daily', priority:'0.8', lastmod:today}));
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`
   + urls.map(u=>`<url><loc>${h(u.loc)}</loc>${u.lastmod?`<lastmod>${h(u.lastmod)}</lastmod>`:''}<changefreq>${h(u.changefreq)}</changefreq><priority>${h(u.priority)}</priority></url>`).join('\n')
   + `\n</urlset>`;
  return new Response(xml,{status:200,headers:{'Content-Type':'application/xml; charset=UTF-8','Cache-Control':CC}});
 }

 // ── Sitemap Video + Album (/sitemap.xml?type=video|album) ────────────────────
 const isVid = stype === 'video';
 const isAlb = stype === 'album';
 if (!isVid && !isAlb) return Response.redirect(base+'/sitemap.xml', 302);

 let contentUrls = [];
 try {
  const ftype = isVid ? 'video' : 'album';
  // OPT: kurangi per_page 200→100 untuk hemat memory + CPU parsing
  // Total: 3×100=300 items masih lebih dari cukup untuk sitemap
  const [t1,r1,r2] = await Promise.allSettled([
   client.getTrending(100, ftype),
   client.getMediaList({page:1, per_page:100, sort:'newest', type:ftype}),
   client.getMediaList({page:2, per_page:100, sort:'newest', type:ftype}),
  ]);
  const seen = new Set();
  const items = [
   ...((t1.status==='fulfilled'?t1.value?.data:null)||[]),
   ...((r1.status==='fulfilled'?r1.value?.data:null)||[]),
   ...((r2.status==='fulfilled'?r2.value?.data:null)||[]),
  ].filter(item=>{
   if (!item?.id || seen.has(item.id)) return false;
   seen.add(item.id);
   return !item.type || (isVid ? item.type==='video' : item.type==='album');
  });

  items.forEach(item=>{
   // FIX: validasi lastmod — cegah "Invalid date" GSC jika field DB kosong/malformed
   const _lmRaw = item.updated_at || item.created_at || '';
   const _lmDate = _lmRaw ? new Date(_lmRaw) : null;
   const lastmod  = (_lmDate && !isNaN(_lmDate)) ? _lmDate.toISOString().slice(0,10) : '';
   const ageDays  = (Date.now()-new Date(item.created_at||0).getTime())/86400000;
   const priority = ageDays<7?'0.9':ageDays<30?'0.8':ageDays<90?'0.7':'0.6';
   const chf      = ageDays<7?'daily':'weekly';

   // Image sitemap — semua item dengan thumbnail
   const imgXml = item.thumbnail
    ? `\n  <image:image><image:loc>${h(item.thumbnail)}</image:loc><image:title>${h(mbSubstr(item.title||'',0,100))}</image:title></image:image>`
    : '';

   // Video sitemap — hanya untuk tipe video
   let videoXml = '';
   if (isVid && item.thumbnail) {
    const dur    = item.duration ? `\n  <video:duration>${parseInt(item.duration,10)}</video:duration>` : '';
    // FIX: validasi tanggal sebelum dipakai — cegah "Invalid date" di GSC
    const _pubRaw = item.created_at || '';
    const _pubDate = _pubRaw ? new Date(_pubRaw) : null;
    const pub    = (_pubDate && !isNaN(_pubDate)) ? _pubDate.toISOString().slice(0,10) : '';
    // FIX: jangan pakai loc (HTML page) sebagai player_loc — hanya pakai kalau ada player_url asli
    const player = item.player_url ? `\n  <video:player_loc allow_embed="yes">${h(safeUrl(item.player_url))}</video:player_loc>` : '';
    // view_count = engagement signal
    const views  = item.views>0 ? `\n  <video:view_count>${parseInt(item.views,10)}</video:view_count>` : '';
    // rating dari views — normalized signal kualitas
    const rating = item.views>1000 ? `\n  <video:rating>4.5</video:rating>` : item.views>100 ? `\n  <video:rating>4.0</video:rating>` : '';
    videoXml = `\n  <video:video>`
     + `\n  <video:thumbnail_loc>${h(item.thumbnail)}</video:thumbnail_loc>`
     + `\n  <video:title>${h(mbSubstr(item.title||'',0,100))}</video:title>`
     + `\n  <video:description>${h(truncate(item.description||item.title||'',160))}</video:description>`
     + player
     // content_loc dihapus — URL halaman HTML != direct video file (Google spec)
     + dur + (pub?`\n  <video:publication_date>${pub}</video:publication_date>`:'')+views+rating
     + `\n  <video:family_friendly>yes</video:family_friendly>`
     + `\n  <video:live>no</video:live>`
     + `\n  </video:video>`;
   }
   contentUrls.push({loc:base+itemUrl(item,cfg), changefreq:chf, priority, lastmod, extra:imgXml+videoXml});
  });
 } catch(e){ if(cfg.DAPUR_DEBUG) console.error('Sitemap content:',e.message); }

 const imgNs = 'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"';
 const vidNs = isVid ? ' xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"' : '';
 const xmlns = `xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ${imgNs}${vidNs}`;
 const xml   = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset ${xmlns}>\n`
  + contentUrls.slice(0,MAX).map(u=>`<url>\n <loc>${h(u.loc)}</loc>\n ${u.lastmod?`<lastmod>${h(u.lastmod)}</lastmod>\n `:''}<changefreq>${h(u.changefreq)}</changefreq>\n <priority>${h(u.priority)}</priority>${u.extra||''}\n</url>`).join('\n')
  + `\n</urlset>`;
 return new Response(xml,{status:200,headers:{'Content-Type':'application/xml; charset=UTF-8','Cache-Control':CC}});
}

// ── Dedicated sitemap-video.xml — Google Video sitemap spec ──────────────────
// Terpisah dari handleSitemap (?type=video) agar backward-compat dengan
// sitemap index yang sudah submit ke GSC. Hanya Googlebot-Video yang boleh akses.
async function handleSitemapVideo(request, cfg, client) {
 const ua = request.headers.get('User-Agent') || '';
 const isGoogle = ua.includes('Googlebot') || ua.includes('Googlebot-Video') || ua.includes('Google-InspectionTool');
 if (!isGoogle) return new Response('', { status: 403 });

 const base = 'https://' + cfg.WARUNG_DOMAIN;

 // Ambil lebih banyak item — video sitemap coverage lebih luas
 // Strategi: newest pages + trending + oldest pages (sering terlupakan)
 let allItems = [];
 try {
  const [p1, p2, p3, trending, old1, old2] = await Promise.allSettled([
   client.getMediaList({ page: 1, per_page: 100, sort: 'newest', type: 'video' }),
   client.getMediaList({ page: 2, per_page: 100, sort: 'newest', type: 'video' }),
   client.getMediaList({ page: 3, per_page: 100, sort: 'newest', type: 'video' }),
   client.getTrending(100, 'video'),
   client.getMediaList({ page: 1, per_page: 100, sort: 'oldest', type: 'video' }),
   client.getMediaList({ page: 2, per_page: 100, sort: 'oldest', type: 'video' }),
  ]);
  const seen = new Set();
  [[p1,p2,p3,old1,old2].map(r => r.status==='fulfilled'?r.value?.data||[]:[]), trending.status==='fulfilled'?trending.value?.data||[]:[]].flat(2)
   .filter(item => item?.id && !seen.has(item.id) && seen.add(item.id) && item.type==='video')
   .forEach(item => allItems.push(item));
 } catch { /* non-fatal */ }

 const urls = allItems.map(item => {
  const loc = base + itemUrl(item, cfg);
  const lastmod = (() => { const d = new Date(item.updated_at || item.created_at || ''); return !isNaN(d) && (item.updated_at||item.created_at) ? d.toISOString().slice(0,10) : ''; })();
  const ageDays = (Date.now() - new Date(item.created_at || 0).getTime()) / 86400000;
  const priority = ageDays < 7 ? '0.9' : ageDays < 30 ? '0.8' : ageDays < 90 ? '0.7' : '0.6';
  const dur = item.duration ? `\n   <video:duration>${parseInt(item.duration, 10)}</video:duration>` : '';
  // FIX: validasi publication_date — cegah "Invalid date" error di GSC
  const _pubRaw2 = item.created_at || '';
  const _pubDate2 = _pubRaw2 ? new Date(_pubRaw2) : null;
  const pub = (_pubDate2 && !isNaN(_pubDate2)) ? _pubDate2.toISOString().slice(0, 10) : '';
  // FIX KRITIS: jangan fallback player_loc ke loc (URL HTML page) — ini penyebab 500 error GSC
  // Kalau tidak ada player_url asli, hapus tag player_loc sama sekali
  const player = item.player_url ? `\n   <video:player_loc allow_embed="yes">${h(item.player_url)}</video:player_loc>` : '';
  const views  = item.views > 0 ? `\n   <video:view_count>${parseInt(item.views, 10)}</video:view_count>` : '';
  const rating = item.views > 1000 ? `\n   <video:rating>4.5</video:rating>` : item.views > 100 ? `\n   <video:rating>4.0</video:rating>` : '';
  const videoXml = item.thumbnail ? `\n  <video:video>`
   + `\n   <video:thumbnail_loc>${h(item.thumbnail)}</video:thumbnail_loc>`
   + `\n   <video:title>${h(mbSubstr(item.title||'',0,100))}</video:title>`
   + `\n   <video:description>${h(truncate(item.description || item.title, 160))}</video:description>`
   + player + dur
   + (pub ? `\n   <video:publication_date>${pub}</video:publication_date>` : '')
   + views + rating
   + `\n   <video:family_friendly>yes</video:family_friendly>`
   + `\n   <video:live>no</video:live>`
   + `\n  </video:video>` : '';
  return { loc, lastmod, changefreq: ageDays < 7 ? 'daily' : 'weekly', priority, extra: videoXml };
 });

 return _buildSitemapXml(urls, true, false);
}

// ── Dedicated sitemap-image.xml — Google Image sitemap spec ─────────────────
async function handleSitemapImage(request, cfg, client) {
 const ua = request.headers.get('User-Agent') || '';
 const isGoogle = ua.includes('Googlebot') || ua.includes('Googlebot-Image') || ua.includes('Google-InspectionTool');
 if (!isGoogle) return new Response('', { status: 403 });

 const base = 'https://' + cfg.WARUNG_DOMAIN;

 let allItems = [];
 try {
  const [p1, p2, p3] = await Promise.allSettled([
   client.getMediaList({ page: 1, per_page: 100, sort: 'newest' }),
   client.getMediaList({ page: 2, per_page: 100, sort: 'newest' }),
   client.getTrending(100),
  ]);
  const seen = new Set();
  [p1, p2, p3].map(r => r.status === 'fulfilled' ? r.value?.data || [] : []).flat()
   .filter(item => item?.id && item.thumbnail && !seen.has(item.id) && seen.add(item.id))
   .forEach(item => allItems.push(item));
 } catch { /* non-fatal */ }

 const urls = allItems.map(item => {
  const loc = base + itemUrl(item, cfg);
  const lastmod = (() => { const d = new Date(item.updated_at || item.created_at || ''); return !isNaN(d) && (item.updated_at||item.created_at) ? d.toISOString().slice(0,10) : ''; })();
  const ageDays = (Date.now() - new Date(item.created_at || 0).getTime()) / 86400000;
  const imgXml = `\n  <image:image>`
   + `\n   <image:loc>${h(item.thumbnail)}</image:loc>`
   + `\n   <image:title>${h(mbSubstr(item.title||'',0,100))}</image:title>`
   + (item.description ? `\n   <image:caption>${h(truncate(item.description, 100))}</image:caption>` : '')
   + `\n  </image:image>`;
  return { loc, lastmod, changefreq: ageDays < 7 ? 'daily' : 'weekly', priority: ageDays < 30 ? '0.8' : '0.6', extra: imgXml };
 });

 return _buildSitemapXml(urls, false, true);
}

// ── Shared sitemap XML builder ───────────────────────────────────────────────
function _buildSitemapXml(urls, hasVideo = false, hasImage = false) {
 const xmlns = [
  `xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"`,
  hasVideo ? `xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"` : '',
  hasImage ? `xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"` : '',
 ].filter(Boolean).join('\n ');
 const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset ${xmlns}>
${urls.slice(0, 50000).map(u => ` <url>\n  <loc>${h(u.loc)}</loc>${u.lastmod ? `\n  <lastmod>${h(u.lastmod)}</lastmod>` : ''}\n  <changefreq>${h(u.changefreq || 'weekly')}</changefreq>\n  <priority>${h(u.priority || '0.6')}</priority>${u.extra || ''}\n </url>`).join('\n')}
</urlset>`;
 return new Response(xml, {
  status: 200,
  headers: { 'Content-Type': 'application/xml; charset=UTF-8', 'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400' },
 });
}


function htmlHeaders(cfg, contentType) {
 contentType=contentType||'page';
 const ck=(cfg?.WARUNG_DOMAIN||'')+':'+contentType;
 const cached = _headersCache.get(ck);

 if (cached) return {...cached};
 const cacheByType={
 home: 'public, max-age=180, s-maxage=3600, stale-while-revalidate=7200, stale-if-error=86400',
 article: 'public, max-age=3600, s-maxage=604800, stale-while-revalidate=86400, stale-if-error=2592000',
 list: 'public, max-age=300, s-maxage=3600, stale-while-revalidate=7200, stale-if-error=86400',
 search: 'no-store',
 page: 'public, max-age=600, s-maxage=86400, stale-while-revalidate=43200, stale-if-error=604800',
 };
 const seed=cfg?hashSeed(cfg.WARUNG_DOMAIN||''):0;
 const refPolicies=['strict-origin-when-cross-origin','strict-origin-when-cross-origin','strict-origin'];
 const headers={
 'Content-Type': 'text/html; charset=UTF-8',
 'Content-Language': cfg?.SEO_LANG || 'id',
 // X-Content-Type-Options dihapus — CF inject 'nosniff' otomatis di semua response

 'X-Frame-Options': 'SAMEORIGIN', // CF Transform Rules bisa handle ini tanpa Worker CPU — keep untuk defense-in-depth
 // X-XSS-Protection dihapus — deprecated, bisa sebabkan XSS baru di Chrome. Gunakan CSP saja.
 // X-DNS-Prefetch-Control dihapus — sudah handle via <link rel=dns-prefetch> di HTML
 'X-Warung-Version': 'v31.0-free',
 'Referrer-Policy': refPolicies[seed%refPolicies.length],
 'Cache-Control': cacheByType[contentType]||cacheByType.page,
 // Vary: Accept-Encoding — CF strip/inject otomatis via compression pipeline.
 // Accept: tidak relevan untuk HTML — browser tidak content-negotiate HTML.
 // Solusi: kirim Accept-Encoding agar proxy cache non-CF tidak serve
 // compressed content ke client yang tidak support gzip/br.
 // CF cerdas: tidak double-compress kalau header ini sudah ada.
 'Vary': 'Accept-Encoding',
 'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), interest-cohort=()',
 // Strict-Transport-Security dihapus dari Worker — CF inject otomatis via SSL/TLS → HSTS setting
 // Set di CF dashboard: SSL/TLS → Edge Certificates → HSTS. Jangan duplicate di sini.
 'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
 'Cross-Origin-Resource-Policy': 'cross-origin',
 'X-Permitted-Cross-Domain-Policies': 'none',
 };
 _headersCache.set(ck, headers);
 return {...headers};
}

const _JSON_HEADERS={'Content-Type':'application/json; charset=UTF-8'};

// ── IndexNow Webhook Handler — real-time ping saat konten update ────────────
// Endpoint: POST /webhook/indexnow
// Body: { "urls": ["https://domain.com/path1", ...], "secret": "DAPUR_API_KEY" }
// Trigger dari CMS/dapur saat konten publish/update — langsung ping 4 endpoint sekaligus
async function handleIndexNowWebhook(request, env) {
 if (request.method !== 'POST') {
 return new Response(JSON.stringify({ error: 'Method not allowed' }), {
 status: 405, headers: { 'Content-Type': 'application/json' }
 });
 }
 try {
 const body = await request.json();
 // FIX SEC: validasi URL — hanya izinkan URL dari domain sendiri
 // Tanpa ini, attacker yang punya secret bisa ping URL kompetitor ke IndexNow
 const cfg0 = getConfig(env, request);
 const _allowedHost = cfg0.WARUNG_DOMAIN.toLowerCase();
 const urls = Array.isArray(body.urls)
  ? body.urls.filter(u => {
   if (typeof u !== 'string') return false;
   try { return new URL(u).hostname.toLowerCase() === _allowedHost; } catch { return false; }
  }).slice(0, 50)
  : [];
 const secret = body.secret || '';
 const cfg = cfg0; // reuse dari URL validation di atas
 // Validasi secret — WAJIB pakai INDEXNOW_SECRET yang terpisah dari DAPUR_API_KEY.
 // Fallback ke DAPUR_API_KEY dihapus: siapa saja yang tahu API key utama bisa
 // trigger IndexNow ping ke URL sembarang (abuse/amplification vector).
 // Kalau INDEXNOW_SECRET belum di-set di env, endpoint ditolak dengan 503.
 const validSecret = env.INDEXNOW_SECRET || null;
 if (!validSecret) {
  return new Response(JSON.stringify({ error: 'INDEXNOW_SECRET not configured on this worker' }), {
  status: 503, headers: { 'Content-Type': 'application/json' }
  });
 }
 // FIX SEC: constant-time comparison mencegah timing attack
 // Encode keduanya ke Uint8Array lalu bandingkan byte-by-byte
 const _safeEq = (a, b) => {
  if (!a || !b || a.length !== b.length) return false;
  const _enc = new TextEncoder();
  const _ab = _enc.encode(a), _bb = _enc.encode(b);
  let _diff = 0;
  for (let _i = 0; _i < _ab.length; _i++) _diff |= _ab[_i] ^ _bb[_i];
  return _diff === 0;
 };
 if (!secret || !_safeEq(secret, validSecret)) {
 return new Response(JSON.stringify({ error: 'Unauthorized' }), {
 status: 401, headers: { 'Content-Type': 'application/json' }
 });
 }
 if (!urls.length) {
 return new Response(JSON.stringify({ error: 'No URLs provided' }), {
 status: 400, headers: { 'Content-Type': 'application/json' }
 });
 }
 // Ping semua 4 IndexNow endpoint sekaligus — key derivasi dari INDEXNOW_SECRET saja
 const host = cfg.WARUNG_DOMAIN;
 const key = hexHash(host + ':' + validSecret, 16);
 const payload = { host, key, keyLocation:`https://${host}/${key}.txt`, urlList: urls };
 const jobs = _INDEXNOW_ENDPOINTS.map(endpoint =>
 fetch(endpoint, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json; charset=utf-8', 'User-Agent': 'IndexingHammer/2.0' },
 body: JSON.stringify(payload),
 cf: { cacheTtl: 0 },
 }).catch(err => ({ ok: false, error: String(err) }))
 );
 // Google sitemap ping untuk setiap URL
 const gJobs = urls.slice(0,5).map(u =>
 fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent('https://'+host+'/sitemap.xml')}`, {
 method: 'GET', cf: { cacheTtl: 0 }
 }).catch(()=>({}))
 );
 const results = await Promise.allSettled([...jobs, ...gJobs]);
 const pings = results.slice(0, jobs.length).map((r,i) => ({
 endpoint: _INDEXNOW_ENDPOINTS[i] || 'google',
 ok: r.status === 'fulfilled' && r.value && r.value.ok !== false,
 }));
 return new Response(JSON.stringify({
 success: true,
 urls_pinged: urls.length,
 endpoints: pings,
 ts: new Date().toISOString(),
 }), { status: 200, headers: { 'Content-Type': 'application/json' } });
 } catch (err) {
 logError('webhook.indexnow', err);
 return new Response(JSON.stringify({ error: 'Internal error' }), {
 status: 500, headers: { 'Content-Type': 'application/json' }
 });
 }
}

// ── FIX 3: HDC Cold Start — KV Snapshot Pre-warm ─────────────────────────────
// _hdcWarmInFlight didefinisikan di module scope (baris ~291) agar tersedia sebelum handleView.

/**
 * hdcSnapshotSave — serialize top-100 item populer dari SemanticIndex ke KV.
 * Dipanggil oleh Cron scheduled handler setiap 30 menit. Budget: 48 KV writes/hari.
 */
async function hdcSnapshotSave(domain, kv) {
 if (!kv || !domain) return;
 try {
  const prefix = domain + ':';
  // Kumpulkan semua entry dari _hdcDocCache untuk domain ini
  const entries = [];
  for (const [key, val] of _hdcDocCache) {
   if (key.startsWith(prefix) && val?.vec && val?.id) {
    entries.push(val);
   }
  }
  if (entries.length < 5) return; // Tidak worth snapshot kalau sedikit

  // OPT 30K: naik dari top-100 → top-500.
  // Dengan 30K konten, top-100 hanya 0.3% corpus. top-500 = 1.7%, coverage lebih baik.
  // KV value size: 500 items × ~1.6KB = ~780KB — jauh di bawah limit 25MB.
  // Budget KV writes tidak berubah: masih 1 write per cron (48/hari).
  const top100 = entries
   .sort((a, b) => (b.views || 0) - (a.views || 0))
   .slice(0, 500);

  const snapshot = {
   ts: Date.now(),
   domain,
   items: top100.map(e => ({
    doc_key: `${domain}:${e.id}`,
    vec_data: JSON.stringify(Array.from(e.vec)),
    title: e.title || '',
    item_type: e.type || 'video',
    views: e.views || 0,
   })),
  };

  await kv.put(`hdc_snapshot:${domain}`, JSON.stringify(snapshot), {
   expirationTtl: 7200, // 2 jam — aman kalau cron 30 menit
  });
 } catch (err) {
  console.error('[hdcSnapshotSave]', err?.message);
 }
}

/**
 * hdcSnapshotLoad — load KV snapshot ke _hdcDocCache in-memory.
 * Return: jumlah item yang berhasil di-load (0 = miss/gagal/expired).
 */
async function hdcSnapshotLoad(domain, kv) {
 if (!kv || !domain) return 0;
 try {
  const raw = await kv.get(`hdc_snapshot:${domain}`);
  if (!raw) return 0;

  const snapshot = JSON.parse(raw);
  const age = Date.now() - (snapshot.ts || 0);
  // Snapshot terlalu lama (> 35 menit = interval + buffer) — jangan pakai
  if (age > 2_100_000) return 0;

  const items = snapshot.items || [];
  if (!items.length) return 0;

  let loaded = 0;
  const prefix = domain + ':';
  for (const item of items) {
   try {
    if (_hdcDocCache.get(item.doc_key)) continue; // sudah ada — skip
    const vecArr = JSON.parse(item.vec_data);
    // FIX #D: validasi panjang vektor — harus _HDC_CHUNKS*2 agar konsisten dengan _hdcSimilarity.
    // Sebelumnya hanya cek length === 0 → vektor corrupt/salah dimensi tetap masuk cache.
    if (!Array.isArray(vecArr) || vecArr.length !== _HDC_CHUNKS * 2) continue;
    const vec = new Uint32Array(vecArr);
    // FIX #D: parseInt(itemId) agar id selalu Number, konsisten dengan SemanticIndex.index()
    // yang set id: item.id (Number dari API). Tanpa ini: entry.id === targetId selalu false
    // (string '123' !== number 123) → konten target tidak pernah ter-skip di scanAll.
    const itemId = parseInt(item.doc_key.slice(prefix.length), 10);
    _hdcDocCache.set(item.doc_key, {
     vec,
     id: itemId,
     title: item.title || '',
     url: null,
     type: item.item_type || 'video',
     thumb: null,
     views: item.views || 0,
    });
    loaded++;
   } catch { /* item corrupt — skip */ }
  }
  return loaded;
 } catch {
  return 0;
 }
}
// ── END FIX 3 helpers ─────────────────────────────────────────────────────────

async function _fetch(request, env, ctx) {
 const waitUntil = ctx.waitUntil.bind(ctx);

 const reqCtx = { id: crypto.randomUUID().slice(0, 8), startTime: Date.now() };

 const url = new URL(request.url);
 const reqPathRaw = url.pathname;
 const reqPathLower= reqPathRaw.toLowerCase();
 const reqBasename = reqPathLower.replace(/^.*\//,'');
 const isHandled = _HANDLED_PATHS.has(reqBasename);
 if (!isHandled && _STATIC_EXT_RX.test(reqPathRaw)) {
 // ── Cache aset /assets/ selama 1 tahun (hemat 35 KiB per PageSpeed) ──
 if (reqPathLower.startsWith('/assets/')) {
 if (!env.ASSETS) return new Response('Not Found', { status: 404 });
 const assetUrl = new URL(request.url); assetUrl.search = '';
 const assetResp = await env.ASSETS.fetch(new Request(assetUrl.toString(), request));
 const newHeaders = new Headers(assetResp.headers);
 newHeaders.set('Cache-Control', 'public, max-age=31536000, immutable');
  newHeaders.set('Timing-Allow-Origin', '*');
  newHeaders.set('Cross-Origin-Resource-Policy', 'cross-origin');
 return new Response(assetResp.body, {
 status: assetResp.status,
 statusText: assetResp.statusText,
 headers: newHeaders,
 });
 }
 if (!env.ASSETS) return new Response('Not Found', { status: 404 });
 const _staticUrl = new URL(request.url); _staticUrl.search = '';
 return env.ASSETS.fetch(new Request(_staticUrl.toString(), request));
 }

 // ── Anomaly Engine v2: SWR Revalidation Bypass ───────────────────────────
 // Self-fetch dari stale revalidation — bypass semua bot detection + cache check.
 // Token divalidasi: harus cocok dengan _AE2_REVAL_SECRET yang di-generate
 // saat module load. External spoofing tidak mungkin karena secret tidak
 // pernah keluar dari worker isolate.
 const _revalToken = request.headers.get('X-AE2-Reval');
 if (_revalToken && _revalToken === getAE2RevalSecret()) {
 // Fast-path: langsung ke routing, skip bot detection, cache check, rate limit.
 // Response: raw HTML saja, tanpa cssInject/amplifyIntent
 // (yang akan di-apply fresh saat hit oleh request manusia berikutnya).
 const _revalCfg = getConfig(env, request);
 const _revalDb = env.DB || null;
 const _revalIm = applyImmortalEnv(env, _DEFAULT_CONFIG);
 const _revalClient = new DapurClient(_revalCfg, env, { waitUntil: fn => waitUntil(fn) }, _revalDb, _revalIm);
 // Dapur config — await langsung, revalidasi tidak perlu optimisasi latency
 const _revalDapurCfg = await _revalClient.getDapurConfig().catch(() => null);
 const _revalReqCfg = _revalDapurCfg
 ? Object.assign(Object.create(null), _revalCfg, { _dapurConfig: _revalDapurCfg, WARUNG_TYPE: _revalDapurCfg.warung_type || _revalCfg.WARUNG_TYPE })
 : _revalCfg;
 const _revalSeo = (() => { let s = _seoCache.get(_revalCfg.WARUNG_DOMAIN); if (!s) { s = new SeoHelper(_revalCfg); _seoCache.set(_revalCfg.WARUNG_DOMAIN, s); } return Object.assign(Object.create(Object.getPrototypeOf(s)), s, { cfg: _revalReqCfg }); })();

 // Routing — duplikat minimal dari routing block utama
 const _rUrl = new URL(request.url);
 const _rClean = _rUrl.pathname.replace(/^\/+/,'');
 const _rSegs = _rClean ? _rClean.split('/') : [];
 const _rFirst = (_rSegs[0] || '').toLowerCase();
 const _rPc = _revalReqCfg.PATH_CONTENT.toLowerCase();
 const _rPa = _revalReqCfg.PATH_ALBUM.toLowerCase();
 const _rPs = _revalReqCfg.PATH_SEARCH.toLowerCase();
 const _rPt = _revalReqCfg.PATH_TAG.toLowerCase();
 const _rPca = _revalReqCfg.PATH_CATEGORY.toLowerCase();

 let _revalResp;
 try {
 if (!_rFirst || _rUrl.pathname === '/') {
 _revalResp = await handleHome(request, _revalReqCfg, _revalClient, _revalSeo);
 } else if (_rFirst === _rPc || _rFirst === _rPa) {
 _revalResp = await handleView(request, _revalReqCfg, _revalClient, _revalSeo, _rSegs, {});
 } else if (_rFirst === _rPca || _rFirst === _rPt) {
 _rFirst === _rPca
 ? _revalResp = await handleCategory(request, _revalReqCfg, _revalClient, _revalSeo, _rSegs)
 : _revalResp = await handleTag(request, _revalReqCfg, _revalClient, _revalSeo, _rSegs);
 } else if (_rFirst === _rPs) {
 _revalResp = await handleSearch(request, _revalReqCfg, _revalClient, _revalSeo);
 } else {
 _revalResp = await handle404(_revalReqCfg, _revalSeo, request);
 }
 } catch { _revalResp = null; }

 if (_revalResp) {
 const _ct = _revalResp.headers.get('Content-Type') || '';
 if (_ct.includes('text/html')) {
 // Return raw HTML — tidak ada cssInject/amplifyIntent
 // Cache akan di-update oleh caller (waitUntil di stale path)
 return new Response(await _revalResp.text(), {
 status: 200,
 headers: { 'Content-Type': 'text/html; charset=UTF-8', 'X-AE2-Raw': '1' },
 });
 }
 }
 return _revalResp || new Response('', { status: 204 });
 }
 // ─────────────────────────────────────────────────────────────────────────

 // ── IndexNow Webhook — POST /webhook/indexnow ─────────────────────────────
 if (reqPathLower === '/webhook/indexnow') return handleIndexNowWebhook(request, env);

 // ── Anomaly Engine v2: Cache Purge Webhook — POST /webhook/cache-purge ────
 // Dipanggil saat konten di Dapur update — invalidate cache halaman terkait
 // Auth: X-Purge-Key harus cocok dengan DAPUR_API_KEY
 if (reqPathLower === '/webhook/cache-purge' && request.method === 'POST') {
 const purgeKey = request.headers.get('X-Purge-Key') || '';
 const cfgForPurge = getConfig(env, request);
 // FIX SEC: constant-time comparison
  const _pEq = (a, b) => { if (!a||!b||a.length!==b.length) return false; const e=new TextEncoder(),ab=e.encode(a),bb=e.encode(b); let d=0; for(let i=0;i<ab.length;i++) d|=ab[i]^bb[i]; return d===0; };
  if (!purgeKey || !_pEq(purgeKey, cfgForPurge.DAPUR_API_KEY)) {
 return new Response('Unauthorized', { status: 401 });
 }
 try {
 const body = await request.json();
 const paths = Array.isArray(body?.paths) ? body.paths : [];
 const domain = cfgForPurge.WARUNG_DOMAIN;
 // Purge setiap path yang dikirim
 const purged = [];
 for (const p of paths.slice(0, 50)) { // max 50 path per request
 const url_to_purge = _ae2CacheKey(domain, p, new URLSearchParams());
 try {
 await caches.default.delete(new Request(url_to_purge));
 purged.push(p);
 } catch { /* skip gagal */ }
 }
 // Kalau paths kosong — purge home dan halaman list
 if (paths.length === 0) {
 const homeKey = _ae2CacheKey(domain, '/', new URLSearchParams());
 await caches.default.delete(new Request(homeKey)).catch(() => {});
 purged.push('/');
 }
 return new Response(JSON.stringify({ purged, count: purged.length }), {
 status: 200, headers: { 'Content-Type': 'application/json' },
 });
 } catch {
 return new Response('Bad Request', { status: 400 });
 }
 }


 // ── Watch Time Proxy — POST /track/wt ────────────────────────────────────
 // Browser tidak bisa panggil Dapur langsung (API key tidak boleh expose ke client).
 // Worker menjadi proxy: terima seconds dari browser, forward ke Dapur dengan API key.
 // Dipanggil via sendBeacon saat pagehide/visibilitychange di pageScript view.
 if (reqPathLower === '/track/wt' && request.method === 'POST') {
  try {
   const cfg0 = getConfig(env, request);
   const db0  = env.DB || null;
   const im0  = applyImmortalEnv(env, _DEFAULT_CONFIG);
   const cl0  = new DapurClient(cfg0, env, { waitUntil: fn => waitUntil(fn) }, db0, im0);
   const body = await request.json().catch(() => null);
   const id      = safeParseInt(body?.id, 0);
   const seconds = safeParseInt(body?.s,  0);
   if (id > 0 && seconds > 0 && seconds <= 86400) {
    waitUntil(cl0.recordWatchTime(id, seconds).catch(() => {}));
   }
  } catch { /* non-fatal */ }
  // Selalu 204 — browser tidak perlu tahu hasilnya, cukup fire-and-forget
  return new Response(null, { status: 204 });
 }

 // D1 binding — null jika tidak dikonfigurasi, semua fitur D1 graceful degrade
 const db = env.DB || null;

 // cfg di-hoist ke atas — getConfig sudah cached via _cfgCacheMap, O(1) setelah hit pertama
 const cfg = getConfig(env, request);


 // ── D1 Blacklist: cek SEBELUM apapun ─────────────────────────────────────
 // Block bot lama yang sudah masuk honeypot — hemat semua proses berikutnya
 const ip = request.headers.get('CF-Connecting-IP')||'0.0.0.0';
 const ua = request.headers.get('User-Agent')||'';
 if (db && !isSearchBot(ua)) {
 // Memory cache check dulu (0ms) sebelum D1
 if (!isBlacklisted(ip)) {
 try {
 const blocked = await db.prepare(
 'SELECT 1 FROM blocked_ips WHERE ip = ? LIMIT 1'
 ).bind(ip).first();
 if (blocked) {
 // Sync ke memory agar request berikutnya tidak perlu D1
 _blCache.set(ip, { blocked: true, ts: Date.now() });
 return new Response(null, { status: 200 });
 }
 } catch(e) { /* D1 error tidak boleh block request */ }
 }
 }

 // ── D1 Cleanup berkala — 1x per ~1000 request, async tidak block ─────────
 // FIX: ganti Math.random() dengan deterministic modulo — hindari multi-isolate race
 // Pakai hash dari IP + time-window 10 menit agar distribusi merata lintas isolate
 if (db && (hashSeed(ip + ':d1clean:' + Math.floor(Date.now() / 600000)) % 1000) === 0) {
 waitUntil(
 db.batch([
  // api_cache: hapus entry expired
  db.prepare('DELETE FROM api_cache WHERE expires_at < ?').bind(Date.now()),
  // rate_limit: hapus window lama (> 2x WINDOW agar ada toleransi)
  db.prepare('DELETE FROM rate_limit WHERE window_start + 120 < ?').bind(Math.floor(Date.now() / 1000)),
  // hdc_vectors: hapus entry expired (expires_at != 0 AND expired)
  db.prepare('DELETE FROM hdc_vectors WHERE expires_at != 0 AND expires_at < ?').bind(Date.now()),
 ]).catch(()=>{})
 );
 }

 const immortal = applyImmortalEnv(env, _DEFAULT_CONFIG);

 let seo = _seoCache.get(cfg.WARUNG_DOMAIN);
 if (!seo) { seo = new SeoHelper(cfg); _seoCache.set(cfg.WARUNG_DOMAIN, seo); }
 const path = url.pathname;

 const honeyPrefix=(env.HONEYPOT_PREFIX||_DEFAULT_CONFIG.HONEYPOT_PREFIX||'trap').replace(/[^a-z0-9\-]/gi,'');

 let cleanPath=path;
 if (cfg.WARUNG_BASE_PATH&&cleanPath.startsWith(cfg.WARUNG_BASE_PATH)) cleanPath=cleanPath.slice(cfg.WARUNG_BASE_PATH.length);
 cleanPath=cleanPath.replace(/^\/+/,'');
 const segments=cleanPath?cleanPath.split('/'):[];
 const first=(segments[0]||'').toLowerCase();

 if (first===honeyPrefix) return handleHoneypot(request,env);

 // ── FIX 1: Spoofed Googlebot integration ─────────────────────────────────
 const isSearchBotUA = isSearchBot(ua);
 // Warm RDNS cache dari KV (non-blocking, ~1ms)
 if (isSearchBotUA && env.KV) {
  waitUntil(seedSearchBotCacheFromKV(ip, env.KV));
 }
 // Deteksi spoofer: UA claim Googlebot tapi ASN/RDNS tidak cocok
 const _isSpoofed = isSearchBotUA && isSearchBotSpoofed(ua, request.cf || {}, ip);
 if (_isSpoofed) {
  // Trigger RDNS validation background untuk future requests
  if (env.KV) waitUntil(validateSearchBotAsync(ip, ua, env.KV));
  // Spoofer: cabut bypass privilege — classifyVisitorFull jalan normal
  const _spoofedType = classifyVisitorFull(request);
  if (_spoofedType === 'scraper' || _spoofedType === 'headless') {
   const bhHtml = await blackholeCapture(ip, true, env, immortal);
   if (bhHtml) return new Response(bhHtml, { headers: {'Content-Type':'text/html'} });
  }
 }
 // effectiveIsSearchBot: hanya true kalau benar-benar searchbot (bukan spoof)
 const effectiveIsSearchBot = isSearchBotUA && !_isSpoofed;
 // ── END FIX 1 integration ─────────────────────────────────────────────────

 const isPublicFeed=first==='sitemap.xml'||first==='sitemap-video.xml'||first==='sitemap-image.xml'||first==='sitemap-index.xml'||first==='sitemap-pages.xml'||first==='rss.xml'||first==='feed.xml'||first==='feed'||first==='robots.txt';
 // sitemap.xml sudah handle query params ?type= di dalam handleSitemap — tidak perlu flag tambahan

 // ── Anomaly Engine v2: AI Crawler detection + Cache API ──────────────────
 const isAiCrawlerUA = isAiCrawler(ua);

 // PENTING: _visitorTypeCache harus tetap di dalam scope onRequest (per-request).
 // Jangan pindahkan ke module scope — akan jadi shared state antar request (Isolate bisa reuse).
 let _visitorTypeCache = null;
 const getVisitorType = () => { if (!_visitorTypeCache) _visitorTypeCache = classifyVisitorFull(request); return _visitorTypeCache; };

 // Cache API: GET + bukan feed + bukan search/AI bot + bukan halaman statis
 const _ae2Type = _ae2PageType(first, cfg);
 const _ae2Key = _ae2CacheKey(cfg.WARUNG_DOMAIN, url.pathname, url.searchParams);
 const _ae2CanUseCache = (
 request.method === 'GET' &&
 !isPublicFeed && !effectiveIsSearchBot && !isAiCrawlerUA &&
 _ae2Type !== 'static' &&
 // FIX: bot suspicious/scraper tidak populate cache — cegah cache poisoning
 getVisitorType() !== 'scraper' && getVisitorType() !== 'headless'
 );

 // Cek cache sebelum routing — fresh hit = skip semua Dapur API calls
 let _ae2HtmlFromCache = null;
 let _ae2IsStale = false;
 let _cached = null;
 let _cachedHeaders = null;
 if (_ae2CanUseCache) {
 _cached = await _ae2Get(_ae2Key);
 if (_cached) {
 _cachedHeaders = _cached.headers;
 const _cachedAt = parseInt(_cachedHeaders.get('X-AE2-At') || '0', 10);
 const _ttl = _AE2_TTL[_ae2Type] || 300;
 _ae2IsStale = (Date.now() - _cachedAt) / 1000 > _ttl;
 _ae2HtmlFromCache = await _cached.text();
 }
 }
 // ─────────────────────────────────────────────────────────────────────────

 if (!effectiveIsSearchBot) {

 if (isBlacklisted(ip)) return new Response(null,{status:200});

 if (!isPublicFeed) {

 const visitorType=getVisitorType();

 if (visitorType==='scraper'||visitorType==='headless') {
 const bhHtml = await blackholeCapture(ip, true, env, immortal);
 if (bhHtml) return new Response(bhHtml,{headers:{'Content-Type':'text/html'}});
 }

 if (visitorType==='headless') {
 const ghost = ghostBody(cfg, path, { title: cfg.WARUNG_NAME, description: cfg.SEO_DEFAULT_DESC }, immortal);
 return ghost
 ? new Response(ghost, { status:200, headers:{'Content-Type':'text/html; charset=UTF-8','Cache-Control':'no-store'} })
 : generateFakeContent(cfg, honeyPrefix);
 }

 const sacrificeResp=sacrificeRedirect(request,cfg.WARUNG_DOMAIN,immortal);
 if (sacrificeResp) return sacrificeResp;
 }

 try {
 checkRateLimit(request, immortal, db, waitUntil);
 } catch(err) {
 if (err instanceof RateLimitError) {
 return new Response('Too Many Requests - Coba lagi dalam '+err.retryAfter+' detik.', {
 status:429, headers:{'Retry-After':String(err.retryAfter),'Content-Type':'text/plain; charset=UTF-8'}
 });
 }
 }
 }

 if (request.method==='OPTIONS') {
 return new Response(null,{status:204,headers:{
 'Access-Control-Allow-Origin': 'https://'+cfg.WARUNG_DOMAIN,
 'Access-Control-Allow-Methods':'POST, GET, OPTIONS',
 'Access-Control-Allow-Headers':'Content-Type',
 'Access-Control-Max-Age':'86400',
 }});
 }

 // ── Webmanifest & Apple Touch Icon — generated dinamis, tidak perlu static file ──
 if (reqBasename === 'site.webmanifest') {
 const siteName = cfg.WARUNG_NAME || cfg.WARUNG_DOMAIN || 'Site';
 const accent = cfg.THEME_ACCENT || '#ffaa00';
 const bg = cfg.THEME_BG || '#0a0a0a';
 const lang = cfg.SEO_LANG || 'id';
 const manifest = {
 id: '/',
 name: siteName,
 short_name: siteName.slice(0, 12),
 description: cfg.SEO_DEFAULT_DESC || siteName,
 lang: lang,
 start_url: '/?source=pwa',
 scope: '/',
 display: 'standalone',
 orientation: 'portrait-primary',
 background_color: bg,
 theme_color: accent,
 categories: ['entertainment','video','adult'],
 icons: [
 { src: '/assets/apple-touch-icon.png', sizes: '180x180', type: 'image/png', purpose: 'any maskable' },
 { src: '/assets/favicon.ico', sizes: 'any', type: 'image/x-icon' },
 ],
 shortcuts: [
 { name: 'Terbaru', url: '/?sort=newest', description: 'Konten terbaru' },
 { name: 'Trending', url: '/?trending=1', description: 'Konten trending' },
 ],
 };
 return new Response(JSON.stringify(manifest, null, 2), {
 status: 200,
 headers: {
 'Content-Type': 'application/manifest+json; charset=UTF-8',
 'Cache-Control': 'public, max-age=86400',
 'X-Robots-Tag': 'noindex',
 },
 });
 }

 if (reqBasename === 'apple-touch-icon.png') {
 // Redirect ke og-default.jpg sebagai fallback icon (ganti dengan PNG asli jika ada)
 const iconUrl = 'https://' + cfg.WARUNG_DOMAIN + '/assets/og-default.jpg';
 return Response.redirect(iconUrl, 302);
 }

 const clientCtx = { waitUntil: fn=>waitUntil(fn) };
 const client = new DapurClient(cfg, env, clientCtx, db, immortal);

 // morphPhase dipakai di cssInject — di-compute sebelum cache fast-path agar tersedia untuk fresh hit
 const morphPhase = getMorphPhase(cfg.WARUNG_DOMAIN);

 // ── Anomaly Engine v2: Cache fast-path ───────────────────────────────────
 if (_ae2HtmlFromCache) {
 const _ttl = _AE2_TTL[_ae2Type] || 300;

 if (!_ae2IsStale) {
 // FRESH HIT — 304 check SEBELUM inject (hemat CPU kalau ETag match)
 const _hitEtag = _cachedHeaders.get('X-AE2-ETag') || '';
 const _hit304 = _hitEtag ? _checkConditional(request, _hitEtag, null) : null;
 if (_hit304) return _hit304;
 // ETag tidak match — build response dengan post-processing
 let html = _ae2HtmlFromCache;
 if (immortal.ENABLE_CSS_STEGO) html = cssInject(html, cfg, morphPhase, immortal);
 html = amplifyIntent(html, request, { ...cfg, _immortal: immortal });
 return new Response(html, {
 status: 200,
 headers: Object.assign(htmlHeaders(cfg, _ae2Type), { 'X-AE2': 'hit', ...(_hitEtag && { 'ETag': _hitEtag }) }),
 });
 }

 // STALE HIT — sajikan stale ke user SEKARANG, revalidate di background via self-fetch
 // X-AE2-Reval header berisi secret per-isolate → bypass bot detection di onRequest
 waitUntil((async () => {
 try {
 const revalReq = new Request(request.url, {
 method: 'GET',
 headers: { 'X-AE2-Reval': getAE2RevalSecret() },
 });
 const fresh = await fetch(revalReq);
 if (fresh.ok) {
 const freshHtml = await fresh.text();
 // X-AE2-Raw: revalidate path sudah return raw HTML (no cssInject/amplifyIntent)
 // Pass ETag dari fresh response untuk preserve 304 capability
 const _revalEtag = fresh.headers.get('ETag') || '';
 if (freshHtml) await _ae2Put(_ae2Key, freshHtml, _ttl, _revalEtag);
 }
 } catch { /* revalidasi gagal — cache lama tetap ada, akan dicoba lagi request berikutnya */ }
 })());

 // Sajikan stale dengan minimal post-process (CSS inject skip untuk performa)
 let staleHtml = _ae2HtmlFromCache;
 staleHtml = amplifyIntent(staleHtml, request, { ...cfg, _immortal: immortal });
 return new Response(staleHtml, {
 status: 200,
 headers: Object.assign(htmlHeaders(cfg, _ae2Type), { 'X-AE2': 'stale', 'Cache-Control': 'no-store' }),
 });
 }
 // ─────────────────────────────────────────────────────────────────────────

 let cannibal = _cannibalCache.get(cfg.WARUNG_DOMAIN);
 if (!cannibal) { cannibal = new KeywordCannibalize(cfg, env); _cannibalCache.set(cfg.WARUNG_DOMAIN, cannibal); }
 // Refresh dynamic keywords dari Dapur search-trending (background, non-blocking, 1 jam TTL)
 bgTask(waitUntil, cannibal.refreshFromDapur(client).catch(() => {}));
 const hammer = IndexingHammer.get(env, cfg);

 // FIX: bgTask eval order — JS argument dievaluasi SEBELUM fungsi dipanggil.
 // Pola lama: bgTask(waitUntil, hammer.maybeScheduledPing(waitUntil))
 //   → maybeScheduledPing() diinvoke dulu (KV read), BARU bgTask cek counter.
 //   → Kalau _bgTaskCount >= 20, KV read sudah terlanjur tapi task di-drop.
 // Fix: pre-check in-memory throttle O(1) sebelum argument dievaluasi.
 // Interval harus konsisten: maybeScheduledPing=21600, maybePublishCheck=1800.
 const _bgNow = Math.floor(Date.now() / 1000);
 const _bgDomain = cfg.WARUNG_DOMAIN;
 if ((_scheduledPingLastTs.get(_bgDomain) || 0) + 21600 <= _bgNow) {
  bgTask(waitUntil, hammer.maybeScheduledPing(waitUntil).catch(err => logError('IndexingHammer.schedule', err, request, reqCtx)));
 }
 // Publish-check: cek ke Dapur max tiap 30 menit di background — tidak blocking request pengunjung
 if ((_publishCheckLastTs.get(_bgDomain) || 0) + 1800 <= _bgNow) {
  bgTask(waitUntil, hammer.maybePublishCheck(client, waitUntil).catch(err => logError('IndexingHammer.publishCheck', err, request, reqCtx)));
 }

 // PASF — KV seed saat isolate baru (sekali per domain per cold start, O(1) check)
 // Seed penting agar widget tidak kosong di request pertama setelah cold start
 const _pasfKv = env.KV || env.INDEXNOW_KV || null;
 if (_pasfKv && !_pasfSeeded.has(_bgDomain)) {
  bgTask(waitUntil, pasfSeedFromKV(_bgDomain, _pasfKv).catch(() => {}));
 }
 // PASF — flush ke KV tiap 30 menit (sama interval dengan publishCheck)
 if (_pasfKv && (_pasfLastFlush.get(_bgDomain) || 0) + _PASF_FLUSH_INTERVAL <= _bgNow) {
  _pasfLastFlush.set(_bgDomain, _bgNow); // update sebelum bgTask — cegah concurrent flush
  bgTask(waitUntil, pasfFlushToKV(_bgDomain, _pasfKv).catch(() => {}));
 }

 // Mulai getDapurConfig lebih awal — tidak perlu menunggu selesai dulu untuk lanjut ke routing detection.
 // Promise disimpan, di-await nanti tepat sebelum dipakai. Kalau cache hit, resolve ~0ms.
 const _dapurConfigPromise = client.getDapurConfig();

 // Routing detection bisa jalan sync sambil getDapurConfig inflight
 const pc0=cfg.PATH_CONTENT.toLowerCase();
 const pa0=cfg.PATH_ALBUM.toLowerCase();
 const ps0=cfg.PATH_SEARCH.toLowerCase();
 const pt0=cfg.PATH_TAG.toLowerCase();
 const pca0=cfg.PATH_CATEGORY.toLowerCase();
 const isViewPath = first===pc0||first===pa0;
 const isListPath = first===pca0||first===pt0;
 const isSearchPath= first===ps0;

 // Untuk halaman view (paling berat), mulai fetch media detail secepat mungkin
 // bahkan sebelum dapurConfig resolve — id sudah bisa diekstrak dari segments sekarang
 let _earlyMediaPromise = null;
 let _earlyRelatedPromise = null;
 let _earlyPlayerPromise = null;
 let _earlyDlPromise = null;
 let _earlyAlbumPromise = null;
 if (isViewPath && segments[1]) {
 const _earlyId = safeParseInt(segments[1], 0);
 if (_earlyId > 0) {
 // Mulai semua 5 fetch sekaligus — tidak ada yang butuh hasil fetch lain
 _earlyMediaPromise = client.getMediaDetail(_earlyId);
 _earlyRelatedPromise = client.getRelated(_earlyId, cfg.RELATED_COUNT);
 _earlyPlayerPromise = client.getPlayerUrl(_earlyId);
 // dl dan album saling eksklusif — path prefix sudah cukup untuk tebak type:
 // pc0 (PATH_CONTENT) = video/konten → butuh downloadUrl, tidak butuh album
 // pa0 (PATH_ALBUM) = album → butuh album, tidak butuh downloadUrl
 // Hemat 1 request Dapur per page view dibanding fire keduanya optimistically.
 if (first === pc0) {
 _earlyDlPromise = client.getDownloadUrl(_earlyId);
 } else {
 _earlyAlbumPromise = client.getAlbum(_earlyId);
 }
 }
 }

 const dapurConfig = await _dapurConfigPromise;
 let reqCfg;
 if (dapurConfig) {
 // Ganti JSON.stringify tiap request dengan hashSeed — dapurConfig jarang berubah
 const _dcSig = hashSeed(
 (dapurConfig.warung_type||'') + '|' +
 (dapurConfig.features ? String(Object.keys(dapurConfig.features).sort().join('')) : '') + '|' +
 (dapurConfig.nav_items ? String(dapurConfig.nav_items.length) : '') + '|' +
 (dapurConfig.content_types ? String(dapurConfig.content_types.join('')) : '')
 );
 const rcKey = cfg.WARUNG_DOMAIN + ':' + _dcSig;
 reqCfg = _reqCfgCache.get(rcKey);
 if (!reqCfg) {
 reqCfg = Object.assign(Object.create(null), cfg, {
 _dapurConfig: dapurConfig,
 WARUNG_TYPE: dapurConfig.warung_type || cfg.WARUNG_TYPE,
 });
 _reqCfgCache.set(rcKey, reqCfg);
 }
 } else {
 reqCfg = cfg;
 }

 seo = Object.assign(Object.create(Object.getPrototypeOf(seo)), seo, { cfg: reqCfg });

 const pc=reqCfg.PATH_CONTENT.toLowerCase();
 const pa=reqCfg.PATH_ALBUM.toLowerCase();
 const ps=reqCfg.PATH_SEARCH.toLowerCase();
 const pt=reqCfg.PATH_TAG.toLowerCase();
 const pca=reqCfg.PATH_CATEGORY.toLowerCase();

 let response;

 const cannibalizePath = env.CANNIBALIZE_PATH || _DEFAULT_CONFIG.CANNIBALIZE_PATH || 'k';
 if (first === cannibalizePath) {
 const keyword = cannibal.matchPath(path);
 if (keyword) {
 response = new Response(
 await cannibal.renderLanding(keyword, request, seo, client),
 { status:200, headers: htmlHeaders(reqCfg,'list') }
 );

 bgTask(waitUntil, hammer.pingOnKeywordHit(keyword).catch(()=>{}));
 } else {
 response = await handle404(reqCfg,seo,request);
 }
 }
 else if (first===''||path==='/') response=await handleHome(request,reqCfg,client,seo);
 else if (first==='profile') response=await handleProfile(request,reqCfg,client,seo);
 else if (first==='download') response=await handleDownload(request,reqCfg,client,seo,segments);
 else if (first===pc) response=await handleView(request,reqCfg,client,seo,segments,{mediaP:_earlyMediaPromise,relatedP:_earlyRelatedPromise,playerP:_earlyPlayerPromise,dlP:_earlyDlPromise,albumP:_earlyAlbumPromise});
 else if (first===pa) {
 const albumAllowed=reqCfg._dapurConfig?reqCfg._dapurConfig.features?.has_album_route===true:reqCfg.WARUNG_TYPE!=='A';
 if (!albumAllowed) response=await handle404(reqCfg,seo,request);
 else response=await handleView(request,reqCfg,client,seo,segments,{mediaP:_earlyMediaPromise,relatedP:_earlyRelatedPromise,playerP:_earlyPlayerPromise,dlP:_earlyDlPromise,albumP:_earlyAlbumPromise});
 }
 else if (first===ps) response=await handleSearch(request,reqCfg,client,seo);
 else if (first===pt) response=await handleTag(request,reqCfg,client,seo,segments);
 else if (first===pca) response=await handleCategory(request,reqCfg,client,seo,segments);
 else {
 const staticSlugs=[reqCfg.PATH_ABOUT,reqCfg.PATH_CONTACT,reqCfg.PATH_FAQ,reqCfg.PATH_TERMS,reqCfg.PATH_PRIVACY,reqCfg.PATH_DMCA].map(s=>s.toLowerCase());
 if (staticSlugs.includes(first)) response=await handleStaticPage(reqCfg,seo,request,first);
 else if (first==='sitemap.xml') {
 response=await handleSitemap(request,reqCfg,client,env,honeyPrefix,cannibal);

 if (effectiveIsSearchBot) {
 bgTask(waitUntil, hammer.pingOnSitemap(client,reqCfg).catch(()=>{}));
 }
 }
 // ── Dedicated sitemap endpoints — backward-compat dengan GSC submission lama ──
 else if (first==='sitemap-video.xml') {
 response=await handleSitemapVideo(request,reqCfg,client);
 }
 else if (first==='sitemap-image.xml') {
 response=await handleSitemapImage(request,reqCfg,client);
 }
 else if (first==='rss.xml'||first==='feed'||first==='feed.xml') response=await handleRss(request,reqCfg,client);

 else if (env.INDEXNOW_SECRET && path === `/${hexHash(reqCfg.WARUNG_DOMAIN + ':' + env.INDEXNOW_SECRET, 16)}.txt`) {
 // FIX: hanya serve key file kalau INDEXNOW_SECRET di-set.
 // Fallback ke DAPUR_API_KEY dihapus — bisa dipakai attacker untuk menebak API key.
 return hammer.generateKeyFile();
 }
 else if (first==='robots.txt') {
 const domain=reqCfg.WARUNG_DOMAIN;
 const rk='robots:'+domain+':'+honeyPrefix+':'
   +hexHash((env.DAPUR_API_KEY||'')+(env.SITEMAP_SALT||'')+(env.HONEYPOT_PREFIX||''),8); // FIX: cache invalidate otomatis saat config berubah
 let robotsBody = _robotsCache.get(rk);
 if (!robotsBody) {
 // robots.txt Santet v2 — berjenjang per kelas bot
 const lines = [
 '# robots.txt — '+domain,
 '# Generated by Warung Pujasera Pesugihan / dukunseo.com',
 '# Ojo coba-coba, kompetitor. Wis diatur kabeh iki.',
 '',
 '# TIER 1: Mitra Sejati',
 'User-agent: Googlebot',
 `Disallow: /${honeyPrefix}/`,'Disallow: /track','Allow: /assets/','',
 'User-agent: Googlebot-Image','Allow: /','',
 'User-agent: Googlebot-Video','Allow: /','',
 'User-agent: Google-InspectionTool','Allow: /','',
 'User-agent: Googlebot-News','Allow: /','',
 'User-agent: Bingbot',`Disallow: /${honeyPrefix}/`,'Crawl-delay: 2','',
 'User-agent: Slurp',`Disallow: /${honeyPrefix}/`,'Crawl-delay: 3','',
 'User-agent: DuckDuckBot',`Disallow: /${honeyPrefix}/`,'Crawl-delay: 2','',
 'User-agent: YandexBot',`Disallow: /${honeyPrefix}/`,'Crawl-delay: 3','',
 '',
 '# TIER 2: Kompetitor — Drain Kredit Mereka',
 '# Semrush $120/bulan → Crawl-delay 30s. Habis kreditnya.',
 'User-agent: SemrushBot',`Disallow: /${honeyPrefix}/`,'Disallow: /?','Disallow: /search','Crawl-delay: 30','',
 '# Ahrefs $99/bulan → delay 60s',
 'User-agent: AhrefsBot',`Disallow: /${honeyPrefix}/`,'Disallow: /?','Crawl-delay: 60','',
 'User-agent: MJ12bot',`Disallow: /${honeyPrefix}/`,'Crawl-delay: 60','',
 'User-agent: DotBot','Disallow: /','',
 'User-agent: BLEXBot','Disallow: /','',
 'User-agent: MegaIndex',`Disallow: /${honeyPrefix}/`,'Crawl-delay: 120','',
 'User-agent: SeznamBot',`Disallow: /${honeyPrefix}/`,'Crawl-delay: 30','',
 'User-agent: PetalBot',`Disallow: /${honeyPrefix}/`,'Crawl-delay: 30','',
 'User-agent: DataForSeoBot','Disallow: /','',
 'User-agent: Screaming Frog SEO Spider','Disallow: /','',
 'User-agent: serpstatbot','Disallow: /','',
 'User-agent: seokicks-robot','Disallow: /','',
 'User-agent: ZoominfoBot','Disallow: /','',
 'User-agent: Bytespider','Disallow: /','',
 'User-agent: AspiegelBot','Disallow: /','',
 '',
 '# TIER 3: AI Training Bots — Blokir Total',
 '# Konten awakdewe dudu dataset gratis, cuk.',
 'User-agent: GPTBot','Disallow: /','',
 'User-agent: Google-Extended','Disallow: /','',
 'User-agent: CCBot','Disallow: /','',
 'User-agent: anthropic-ai','Disallow: /','',
 'User-agent: Claude-Web','Disallow: /','',
 'User-agent: Omgilibot','Disallow: /','',
 'User-agent: FacebookBot','Disallow: /','',
 'User-agent: Applebot-Extended','Disallow: /','',
 'User-agent: cohere-ai','Disallow: /','',
 'User-agent: PerplexityBot','Disallow: /','',
 'User-agent: OAI-SearchBot','Disallow: /','',
 '',
 '# TIER 4: Default — Bot Tidak Dikenal',
 '# Sopo kowe? Crawl-delay 10s. Sing sopan nek mampir.',
 'User-agent: *',
 `Disallow: /${honeyPrefix}/`,
 'Disallow: /track',
 'Disallow: /honeypot',
 'Disallow: /trap',
 'Crawl-delay: 10',
 '',
 // Sitemap index — berisi pointer ke video/album/tag/main sitemap
 `Sitemap: https://${cfg.WARUNG_DOMAIN}/sitemap.xml`,
 `Sitemap: https://${cfg.WARUNG_DOMAIN}/sitemap.xml?type=video`,
 `Sitemap: https://${cfg.WARUNG_DOMAIN}/sitemap.xml?type=album`,
 `Sitemap: https://${cfg.WARUNG_DOMAIN}/sitemap.xml?type=tag`,
 ];
 robotsBody = lines.join('\n');
 _robotsCache.set(rk, robotsBody);
 }
 response=new Response(robotsBody,{status:200,headers:{'Content-Type':'text/plain; charset=UTF-8','Cache-Control':'public, max-age=86400'}});
 }
 else response=await handle404(reqCfg,seo,request);
 }

 if (response && !isPublicFeed && !effectiveIsSearchBot) {
 const visitorType=getVisitorType();
 const isBot=visitorType!=='human';
 const contentType=response.headers.get('Content-Type')||'';
 if (contentType.includes('text/html')) {

 // ── Anomaly Engine v2: AI Crawler → Poison Data ──────────────────────
 if (isAiCrawlerUA) {
 let html;
 try { html = await response.text(); } catch { return response; }
 const pSeed = hashSeed(cfg.WARUNG_DOMAIN + ':' + url.pathname);
 const poisoned = poisonContent(html, pSeed);
 return new Response(poisoned, {
 status: response.status,
 headers: {
 'Content-Type': 'text/html; charset=UTF-8',
 'Cache-Control': 'no-store',
 'X-Robots-Tag': 'noindex',
 },
 });
 }

 if (immortal.ENABLE_GHOST_BODY && visitorType==='scraper') {
 const ghostHtml = ghostBody(reqCfg, path, {
 title: reqCfg.WARUNG_NAME,
 description: reqCfg.SEO_DEFAULT_DESC,
 }, immortal);
 if (ghostHtml) return new Response(ghostHtml, {
 status: response.status,
 headers: { 'Content-Type':'text/html; charset=UTF-8', 'Cache-Control':'no-store' },
 });
 }

 if (isBot) {
 let html;
 try { html=await response.text(); } catch { return response; }
 if (immortal.ENABLE_DIGITAL_DNA) html=dnaInjectHtml(html, reqCfg.WARUNG_DOMAIN, path+':'+morphPhase, immortal);
 return new Response(html,{status:response.status,headers:new Headers(response.headers)});
 }

 {
 // MISS — routing sudah jalan, simpan raw HTML ke cache lalu post-process per-request
 let html;
 try { html = await response.text(); } catch { return response; }

 // Simpan raw HTML ke cache SEBELUM cssInject/amplifyIntent
 // cssInject menggunakan morphPhase (per-domain) dan amplifyIntent pakai Referer (per-request)
 // Kalau yang di-cache sudah di-amplify → semua orang dapat Referer orang pertama
 if (_ae2CanUseCache) {
 const _ttl = _AE2_TTL[_ae2Type] || 300;
 // Pass ETag dari response handleView agar bisa di-restore saat cache hit
 const _missEtag = response.headers.get('ETag') || '';
 waitUntil(_ae2Put(_ae2Key, html, _ttl, _missEtag).catch(() => {}));
 }

 // Post-process per-request (tidak masuk cache)
 if (immortal.ENABLE_CSS_STEGO) html = cssInject(html, reqCfg, morphPhase, immortal);
 html = amplifyIntent(html, request, { ...reqCfg, _immortal: immortal });
 return new Response(html, {status:response.status, headers:new Headers(response.headers)});
 }
 }
 }

 return response;
}

async function handleRss(request, cfg, client) {
 const baseUrl = 'https://'+cfg.WARUNG_DOMAIN;
 const siteName = cfg.WARUNG_NAME;
 const tagline = cfg.WARUNG_TAGLINE||'';
 const lang = cfg.SEO_LANG||'id';
 let items = [];
 try {
 const rssTypes = getContentTypes(cfg);
 const rssType = rssTypes.length===1 ? rssTypes[0] : undefined;
 const result = await client.getMediaList({ per_page:20, sort:'newest', ...(rssType?{type:rssType}:{}) });
 items = result?.data||[];
 } catch(err) { logError('RSS.fetch', err); }

 const now = new Date().toUTCString();
 const itemsXml = items.map(item => {
 const iu = baseUrl+(item.type==='album'?albumUrl(item.id,item.title,cfg):contentUrl(item.id,item.title,cfg));
 const pubDate = item.created_at?new Date(item.created_at).toUTCString():now;
 const desc = h(truncate(item.description||item.title||'',300));
 const thumbType = item.thumbnail&&/\.avif(\?|$)/i.test(item.thumbnail)?'image/avif':item.thumbnail&&/\.webp(\?|$)/i.test(item.thumbnail)?'image/webp':/\.png(\?|$)/i.test(item.thumbnail)?'image/png':'image/jpeg';
 const thumb = item.thumbnail?`<enclosure url="${h(item.thumbnail)}" type="${thumbType}" length="0"/>\n <media:thumbnail url="${h(item.thumbnail)}"/>\n <media:content url="${h(item.thumbnail)}" medium="image" type="${thumbType}" width="1280" height="720"/>`:'' ;
 const cats = (item.tags||[]).map(t=>`<category><![CDATA[${t}]]></category>`).join('');
 const author = cfg.CONTACT_EMAIL?`<author>${h(cfg.CONTACT_EMAIL)} (${h(siteName)})</author>`:'';
 const updDate = item.updated_at&&item.updated_at!==item.created_at?`\n <atom:updated>${new Date(item.updated_at).toISOString()}</atom:updated>`:'';
 return ` <item>
 <title><![CDATA[${item.title||''}]]></title>
 <link>${h(iu)}</link>
 <guid isPermaLink="true">${h(iu)}</guid>
 <description><![CDATA[${desc}]]></description>
 <content:encoded><![CDATA[${item.description||item.title||''}]]></content:encoded>
 <pubDate>${pubDate}</pubDate>${updDate}
 ${author}
 ${thumb}
 ${cats}
 </item>`;
 }).join('\n');

 const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
 xmlns:content="http://purl.org/rss/modules/content/"
 xmlns:atom="http://www.w3.org/2005/Atom"
 xmlns:media="http://search.yahoo.com/mrss/"
 xmlns:sy="http://purl.org/rss/modules/syndication/">
 <channel>
 <title><![CDATA[${siteName}]]></title>
 <link>${h(baseUrl)}</link>
 <description><![CDATA[${tagline}]]></description>
 <language>${h(lang)}</language>
 <managingEditor>${h(cfg.CONTACT_EMAIL||'admin@'+cfg.WARUNG_DOMAIN)} (${h(siteName)})</managingEditor>
 <copyright>Copyright ${new Date().getFullYear()} ${h(siteName)}</copyright>
 <lastBuildDate>${now}</lastBuildDate>
 <ttl>60</ttl>
 <sy:updatePeriod>hourly</sy:updatePeriod>
 <sy:updateFrequency>1</sy:updateFrequency>
 <generator>WPP-PujaseraKeramat/33.0</generator>
 <atom:link href="${h(baseUrl+'/rss.xml')}" rel="self" type="application/rss+xml"/>
  <atom:link href="${h(baseUrl+'/sitemap.xml')}" rel="related" type="application/xml"/>
 <image>
 <url>${h(cfg.SEO_OG_IMAGE||baseUrl+'/assets/og-default.jpg')}</url>
 <title><![CDATA[${siteName}]]></title>
 <link>${h(baseUrl)}</link>
 <width>144</width><height>144</height>
 </image>
${itemsXml}
 </channel>
</rss>`;

 const rssEtag = '"rss-'+hashSeed(cfg.WARUNG_DOMAIN+now.slice(0,16)).toString(36)+'"';
 return new Response(xml, {
 status:200,
 headers:{
 'Content-Type':'application/rss+xml; charset=UTF-8',
 'Cache-Control':'public, max-age=900, s-maxage=1800, stale-while-revalidate=3600, stale-if-error=86400',
 'ETag': rssEtag,
 },
 });
}

const _INDEXNOW_ENDPOINTS = [
 'https://api.indexnow.org/indexnow',
 'https://www.bing.com/indexnow',
 'https://yandex.com/indexnow',
 'https://search.seznam.cz/indexnow',
];

const _DEFAULT_CANNIBALIZE_KW = [

  // ============================================
  // 🌶️ bokepporno VARIATIONS
  // ============================================
  'bokepporno',
  'bokep porno',
  'video porno',
  'porno bokep',
  'porno indo',
  'bokep porno terbaru',
  'bokep porno indo',
  'bokep porno 2026',
  'bokep porno full',
  'bokep porno no sensor',
  'porno sange',
  'porno colmek',
  'porno tobrut',
  'porno hijab',
  'porno ukhti',
  'porno tante',
  'porno montok',
  'bokep porno live',
  'streaming porno',
  'nonton porno',
  'video porno indo',
  'bokep porno gratis',
  'porno jilbab',
  'porno bugil',
  'porno telanjang',
  'porno ngentot',
  'porno ngewe',
  'porno porno',
  'porno terbaru 2026',
  'bokep porno hot',
  'porno hot',
  'porno 21',
  'bokep porno 21',
  'porno konten 21',
  'bokep porno konten21',

  // ============================================
  // 🎬 KONTENvideo VARIATIONS
  // ============================================
  'konten21',
  'konten 21',
  'film 21',
  'film21',
  'nonton 21',
  'streaming 21',
  'video 21',
  'video plus',
  'video plus streaming',
  'film semi 21',
  'bioskop 21',
  'bioskop video online',
  'film video terbaru',
  'film video indo',
  'film video gratis',
  'nonton film 21',
  'nonton film video gratis',
  'streaming film 21',
  'film video full',
  'film video no sensor',
  'film dewasa 21',
  'film video hot',
  'film video indo',
  'film video 2026',
  'lk21',
  'indoxxi',
  'rebahin',
  'lkvideo online',
  'indoxxi streaming',
  'rebahin film',
  'dunia21',
  'cinema21',
  'layarkaca21',
  'film semi',
  'bioskop semi',
  'film semi indo',
  'film semi terbaru',
  'nonton film semi',
  'film semi gratis',
  'film semi video terbaru',
  'film semi video indo',

  // ============================================
  // 🔥 MIX & MATCH (bokepporno + KONTEN21)
  // ============================================
  'bokep porno 21',
  'porno 21',
  'bokepporno 21',
  'porno konten 21',
  'konten video porno',
  'bokep porno konten21',
  'film video porno',
  'porno film 21',
  'streaming porno 21',
  'nonton porno 21',
  'video porno 21',
  'porno video plus',
  'bokep porno video indo',
  'porno video indo',
  'porno video terbaru',
  'video bokep porno',
  'video porno',

  // ============================================
  // 🌶️ HEAVY HITTERS (keyword panas)
  // ============================================
  'bokep',
  'bokep indo',
  'bokep terbaru',
  'bokep indo',
  'bokep gratis',
  'bokep online',
  'nonton bokep',
  'streaming bokep',
  'video bokep',
  'bokep hd',
  'bokep 2026',
  'bokep full',
  'bokep no sensor',
  'bokep hijab',
  'bokep jilbab',
  'bokep ukhti',
  'bokep tante',
  'bokep colmek',
  'bokep tobrut',
  'bokep sange',
  'bokep porno',
  'bokep live',
  'bokep live streaming',

  // ============================================
  // 🔞 DEWASA 18+
  // ============================================
  'video dewasa',
  'film dewasa',
  'film dewasa indo',
  'film dewasa terbaru',
  'nonton film dewasa',
  'streaming dewasa',
  'video 18+',
  'film 18+',
  'konten 18+',
  '18 plus',
  '18 plus streaming',
  'film panas',
  'video panas',
  'nonton film panas',
  'film semi panas',
  'bioskop panas',
  'film hot',
  'video hot',
  'video indo hot',
  'hot streaming',

  // ============================================
  // 🇮🇩 INDONESIA FOCUS
  // ============================================
  'bokep indo terbaru',
  'bokep indo indo',
  'bokep indo 2026',
  'bokep indo hot',
  'bokep indo hijab',
  'bokep indo tante',
  'bokep indo colmek',
  'film indo 21',
  'film indo semi',
  'film indo dewasa',
  'nonton film indo',
  'streaming film indo',
  'video indo indo',
  'video indo hot',
  'video indo terbaru',
  'konten indo indo',
  'konten indo hot',
  'asupan indo',
  'asupan indo',
  'asupan hijab',
  'asupan tante',
  'cewek indo',
  'cewek indo hot',
  'cewek indo indo',
  'cewek indo sange',
  'tante indo',
  'tante indo sange',
  'tante indo hot',
  'jilbab indo',
  'jilbab indo',
  'jilbab hot',
  'hijab indo',
  'hijab indo',
  'hijab hot',
  'ukhti indo',
  'ukhti indo',
  'ukhti hot',

  // ============================================
  // 🎥 PLATFORM & SITUS
  // ============================================
  'situs bokep',
  'situs bokep terbaru',
  'situs bokep indo',
  'situs bokep indo',
  'situs film 21',
  'situs film semi',
  'situs film dewasa',
  'situs streaming',
  'situs streaming gratis',
  'situs nonton gratis',
  'link bokep',
  'link bokep terbaru',
  'link film 21',
  'link streaming 21',
  'link lk21',
  'link indoxxi',
  'link rebahin',
  'download bokep',
  'download film 21',
  'download film semi',
  'download video indo',
  'bokep download gratis',
  'film video download',
  'film semi download',

  // ============================================
  // ⏱️ TRENDING & UPDATE
  // ============================================
  'bokep indo 2026',
  'konten indo 2026',
  'film indo 2026',
  'video indo 2026',
  'bokep terbaru 2026',
  'konten terbaru 2026',
  'film terbaru 2026',
  'update bokep',
  'update konten 21',
  'update film semi',
  'indo hari ini',
  'trending bokep',
  'trending konten 21',
  'hot today',
  'indo today',

  // ============================================
  // 🌏 INTERNATIONAL
  // ============================================
  'pinay',
  'pinay indo',
  'pinay scandal',
  'pinay 2026',
  'malay',
  'malay indo',
  'malay hot',
  'malay 2026',
  'thai',
  'thai indo',
  'thai hot',
  'japan',
  'japan indo',
  'japan hot',
  'korea',
  'korea indo',
  'korea hot',
  'china',
  'china indo',
  'china hot',
  'barat',
  'barat indo',
  'barat hot',
  'film barat',
  'film barat semi',
  'film barat dewasa',

  // ============================================
  // 🆕 LONG-TAIL GOLD
  // ============================================
  'nonton bokep porno gratis',
  'nonton film video gratis',
  'streaming bokep porno hd',
  'streaming film video hd',
  'download bokep porno 21',
  'download film video porno',
  'link bokep porno 21',
  'link film video porno',
  'bokep porno video tanpa sensor',
  'film video porno tanpa sensor',
  'bokep porno video indo',
  'film video porno indo',
  'bokep porno video terbaru',
  'film video porno terbaru',
  'bokep porno video indo',
  'film video porno indo',
  'bokep porno video hot',
  'film video porno hot',
  'bokep porno video full',
  'film video porno full',
  'bokep porno video hd',
  'film video porno hd',
  'bokep porno video 2026',
  'film video porno 2026',
  'situs bokep porno 21',
  'situs film video porno',
  'bokep porno konten21',
  'film video bokep porno',
  'porno konten21',
  'konten video porno',
  'video porno bokep',
  'video film porno',
];

class KeywordCannibalize {
 constructor(cfg, env) {
 this.cfg = cfg;
 this.env = env;

 const rawKw = env.CANNIBALIZE_KEYWORDS ?? _DEFAULT_CONFIG.CANNIBALIZE_KEYWORDS;
 this.keywords = rawKw
 ? rawKw.split(',').map(k=>k.trim()).filter(k=>k)
 : _DEFAULT_CANNIBALIZE_KW;
 this.basePath = env.CANNIBALIZE_PATH || _DEFAULT_CONFIG.CANNIBALIZE_PATH || 'k';

 // Dynamic keywords dari Dapur search-trending — diisi async via refreshFromDapur().
 // Terpisah dari this.keywords agar keyword statik env selalu ada meski Dapur down.
 this._dynamicKeywords = [];
 this._dynamicTs = 0;
 this._dynamicTTL = 3600000; // 1 jam — search trending berubah lambat
 }

 /**
  * Refresh dynamic keyword dari Dapur search-trending + indo secara background.
  * Dipanggil dari main handler via bgTask() agar non-blocking.
  *
  * Strategi merge:
  * - indo keyword (naik cepat) → prioritas tinggi, taruh di depan
  * - Trending keyword (stabil dicari, ada konten) → kandidat landing page
  * - Gap keyword (sering dicari, TIDAK ada konten) → skip, hindari landing page kosong
  * - Keyword statik dari env → selalu ada, tidak dihapus
  */
 async refreshFromDapur(client) {
  try {
   const age = Date.now() - this._dynamicTs;
   if (this._dynamicTs > 0 && age < this._dynamicTTL) return; // masih fresh

   const [trendRes, indoRes, gapRes] = await Promise.allSettled([
    client.getSearchTrending('trending', 50),
    client.getSearchTrending('indo', 30),
    client.getSearchTrending('gap', 30),
   ]);

   // Kumpulkan keyword gap (zero-result) untuk filter
   const gapSet = new Set();
   const gapItems = gapRes.status === 'fulfilled' ? (gapRes.value?.data?.items || []) : [];
   for (const g of gapItems) {
    // Hanya skip kalau opportunity 'high' — zero result rate >= 80%
    if (g?.opportunity === 'high' && g?.query) gapSet.add(g.query.toLowerCase());
   }

   const seen = new Set(this.keywords.map(k => k.toLowerCase()));
   const dynamic = [];

   // indo dulu — keyword yang naik cepat lebih valuable untuk landing page
   const indoItems = indoRes.status === 'fulfilled' ? (indoRes.value?.data?.items || []) : [];
   for (const v of indoItems) {
    if (!v?.query) continue;
    const q = v.query.toLowerCase();
    if (seen.has(q) || gapSet.has(q)) continue;
    if (v.trend === 'hot' || v.trend === 'rising') {
     seen.add(q);
     dynamic.push(v.query);
    }
   }

   // Trending — keyword yang stabil dicari dengan konten tersedia
   const trendItems = trendRes.status === 'fulfilled' ? (trendRes.value?.data?.items || []) : [];
   for (const t of trendItems) {
    if (!t?.query) continue;
    const q = t.query.toLowerCase();
    if (seen.has(q) || gapSet.has(q)) continue;
    // Hanya keyword dengan konten (avg_results > 0) dan minimal 3 pencarian
    if ((t.avg_results || 0) > 0 && (t.search_count || 0) >= 3) {
     seen.add(q);
     dynamic.push(t.query);
    }
   }

   this._dynamicKeywords = dynamic;
   this._dynamicTs = Date.now();
  } catch(e) {
   // Non-fatal — keyword statik dari env tetap jalan tanpa dynamic
   logError('KeywordCannibalize.refreshFromDapur', e);
  }
 }

 // Gabungan keyword statik (env) + dynamic (Dapur trending) untuk semua keperluan
 get allKeywords() {
  return [...this.keywords, ...this._dynamicKeywords];
 }

 toSlug(kw) {
 return kw.toLowerCase()
 .replace(/[^a-z0-9\s]/g,'')
 .replace(/\s+/g,'-')
 .trim();
 }

 getAllUrls() {
 return this.allKeywords.map(kw =>
 'https://'+this.cfg.WARUNG_DOMAIN+'/'+this.basePath+'/'+this.toSlug(kw)
 );
 }

 matchPath(path) {
 const prefix = '/'+this.basePath+'/';
 if (!path.startsWith(prefix)) return null;
 const slug = path.slice(prefix.length).replace(/\/.*$/,'');
 if (!slug) return null;

 const kw = this.allKeywords.find(k => this.toSlug(k) === slug);
 return kw || null;
 }

 async renderLanding(keyword, request, seo, client) {
 const cfg = this.cfg;
 const dna = SiteDNA.get(cfg.WARUNG_DOMAIN);
 const slug = this.toSlug(keyword);
 const canonical = 'https://'+cfg.WARUNG_DOMAIN+'/'+this.basePath+'/'+slug;
 const nonce = generateNonce();

 let items = [];
 try {
 const res = await client.search(keyword, { per_page: 24, sort: 'popular' });
 items = res?.data || [];

 if (!items.length) {
 const tr = await client.getTrending(24);
 items = tr?.data || [];
 }
 } catch {}

 const pageTitle = dna.kwTitleTpl(keyword, cfg.WARUNG_NAME);
 const pageDesc = dna.kwDescTpl(keyword, cfg.WARUNG_NAME);
 const pageKeywords= dna.kwKwTpl(keyword);

 const seed = hashSeed(cfg.WARUNG_DOMAIN+keyword);
 const h1 = dna.kwH1Tpl(keyword);
 const intro = dna.kwIntroTpl(keyword, cfg.WARUNG_NAME);

 const faqs = [
 { q: dna.kwFaqQ1Tpl(keyword, cfg.WARUNG_NAME), a: dna.kwFaqA1Tpl(keyword, cfg.WARUNG_NAME) },
 { q: dna.kwFaqQ2Tpl(keyword, cfg.WARUNG_NAME), a: dna.kwFaqA2Tpl(keyword, cfg.WARUNG_NAME) },
 { q: dna.kwFaqQ3Tpl(keyword, cfg.WARUNG_NAME), a: dna.kwFaqA3Tpl(keyword, cfg.WARUNG_NAME) },
 ];

 const faqSchema = JSON.stringify({ '@context':'https://schema.org','@type':'FAQPage', mainEntity: faqs.map(f=>({'@type':'Question','name':f.q,'acceptedAnswer':{'@type':'Answer','text':f.a}})) });
 const breadcrumbSchema= JSON.stringify({ '@context':'https://schema.org','@type':'BreadcrumbList', itemListElement:[ {'@type':'ListItem','position':1,'name':cfg.WARUNG_NAME,'item':'https://'+cfg.WARUNG_DOMAIN+'/'}, {'@type':'ListItem','position':2,'name':keyword,'item':canonical}, ] });
 const collectionSchema= seo.collectionPageSchema(keyword, items, canonical, cfg);

 const grid = items.length
 ? `<ul class="${dna.cls.contentGrid}">${items.map((item,i)=>`<li>${renderCard(item,cfg,i)}</li>`).join('')}</ul>`
 : `<div class="${dna.cls.noResults}"><p>${h(dna.kwEmptyGrid)}</p></div>`;

 const relatedKws = this.allKeywords
 .filter(k=>k!==keyword)
 .sort((a,b)=>hashSeed(keyword+a)%3 - hashSeed(keyword+b)%3)
 .slice(0,8);

 const relatedLinks = relatedKws.map(k=>
 `<a href="/${this.basePath}/${this.toSlug(k)}" class="${dna.cls.tag}">${h(k)}</a>`
 ).join('');

 const head = renderHead({
 title: pageTitle,
 desc: pageDesc,
 canonical,
 keywords: pageKeywords,
 ogType: 'website',
 ogImage: items[0]?.thumbnail || cfg.SEO_OG_IMAGE,
 noindex: false,
 cfg, seo, request,
 extraNonces: [nonce],
 extraHead: `
<script type="application/ld+json" nonce="${nonce}">${faqSchema}</script>
<script type="application/ld+json" nonce="${nonce}">${breadcrumbSchema}</script>
${collectionSchema}`,
 });

 const nav = renderNavHeader({ cfg, currentPage: 'cannibalize' });
 const foot = renderFooter(cfg, request, nonce);

 return `${head}
${nav}
<main id="${dna.ids.mainContent}">
 <div class="${dna.cls.container}">
 <div class="${dna.cls.pageHeader}">
 ${renderBreadcrumb([{name:cfg.WARUNG_NAME,url:'/'},{name:keyword,url:null}], cfg)}
 <h1 class="${dna.cls.pageTitle}">${h(h1)}</h1>
 <p class="${dna.cls.pageDesc}">${h(intro)}</p>
 </div>

 <div class="${dna.cls.layoutMain}">
 <section class="${dna.cls.contentArea}" aria-label="Konten ${h(keyword)}">
 ${grid}
 <div class="${dna.cls.tagCloud}" style="margin:14px 0">${relatedLinks}</div>
 </section>
 </div>
 </div>
</main>
${foot}`;
 }
}

class IndexingHammer {
 constructor(env, cfg) {
 this.env = env;
 this.cfg = cfg;
 this.cannibal = new KeywordCannibalize(cfg, env);
 }

 static get(env, cfg) {
 let h = _hammerCache.get(cfg.WARUNG_DOMAIN);
 if (!h) { h = new IndexingHammer(env, cfg); _hammerCache.set(cfg.WARUNG_DOMAIN, h); }
 return h;
 }

 async pingOnSitemap(client, cfg) {
 try {
 const [trendingRes, recentRes] = await Promise.all([
 client.getTrending(30).catch(()=>({data:[]})),
 client.getMediaList({per_page:30,sort:'newest'}).catch(()=>({data:[]})),
 ]);
 const seen = new Set();
 const allItems = [...(trendingRes?.data||[]),...(recentRes?.data||[])].filter(it=>{
 if (!it?.id||seen.has(it.id)) return false; seen.add(it.id); return true;
 });
 const contentUrls = allItems.map(it=>'https://'+cfg.WARUNG_DOMAIN+itemUrl(it,cfg));
 const kwUrls = this.cannibal.getAllUrls().slice(0,30);
 // FIX DEDUP: filter URL yang sudah di-ping dalam 1 jam — cegah duplikasi dengan pingOnKeywordHit
 const allUrls = [...new Set([...contentUrls, ...kwUrls])]
  .filter(u => !_pingCache.get('ping:' + u));
 if (allUrls.length) {
  await this._pingBulk(allUrls);
  allUrls.forEach(u => _pingCache.set('ping:' + u, 1));
 }
 } catch {}
 }

 async pingOnKeywordHit(keyword) {
 try {
 const slug = this.cannibal.toSlug(keyword);
 const url = 'https://'+this.cfg.WARUNG_DOMAIN+'/'+this.cannibal.basePath+'/'+slug;
 // FIX DEDUP: unified key 'ping:url' — konsisten dengan scheduledPing dan pingOnSitemap
 const cacheKey = 'ping:' + url;
 if (_pingCache.get(cacheKey)) return;
 _pingCache.set(cacheKey, 1);
 await this._pingIndexNow([url]);
 } catch {}
 }

 async pingOnNewContent(items, cfg) {
 try {
 const urls = (items||[])
 .filter(it=>it?.id)
 .map(it=>'https://'+cfg.WARUNG_DOMAIN+itemUrl(it,cfg));
 if (urls.length) await this._pingBulk(urls);
 } catch {}
 }

 // ── kenthongan tanda saat konten pertama kali diakses — pastikan ngupadi ing pepeteng engine tahu ────
 async pingOnFirstView(itemUrl, itemId) {
 try {
 // FIX DEDUP: gunakan full URL sebagai key — konsisten dengan metode ping lainnya.
 // pingview:domain:id tidak bisa di-cross-check dengan scheduledPing yang kenal URL bukan id.
 const cacheKey = 'ping:' + itemUrl;
 if (_pingCache.get(cacheKey)) return; // sudah pernah di-kenthongan tanda
 _pingCache.set(cacheKey, 1);
 await this._pingIndexNow([itemUrl]);
 } catch {}
 }

 async scheduledPing() {
 try {
 // FIX DEDUP: filter URL yang sudah di-ping dalam 1 jam (event-driven ping)
 // sebelum kirim batch — cegah duplikasi dengan pingOnKeywordHit dan pingOnSitemap.
 // Set cache setelah tiap batch berhasil agar URL tidak di-ping ulang di batch berikutnya.
 const allKwUrls = this.cannibal.getAllUrls()
  .filter(u => !_pingCache.get('ping:' + u));
 for (let i=0; i<allKwUrls.length; i+=50) {
 const batch = allKwUrls.slice(i, i+50);
 await this._pingIndexNow(batch);
 batch.forEach(u => _pingCache.set('ping:' + u, 1));
 if (i+50 < allKwUrls.length) await new Promise(r=>setTimeout(r,500));
 }
 } catch {}
 }

 // ── Bulk kenthongan tanda dengan auto-chunking — laporan cepet nang sing mbaureksa max 10.000 URL per panjalukan tamu ───
 async _pingBulk(urls) {
 const deduped = [...new Set(urls)];
 const CHUNK = 50; // aman untuk semua endpoint — Opo sing katon dudu opo sing sejatine
 for (let i=0; i<deduped.length; i+=CHUNK) {
 await this._pingIndexNow(deduped.slice(i, i+CHUNK));
 if (i+CHUNK < deduped.length) await new Promise(r=>setTimeout(r,300));
 }
 }

 // patch: retry dengan exponential backoff — max 2 retry, delay 500ms/1000ms
 async _pingWithRetry(endpoint, payload, maxRetry = 2) {
 for (let i = 0; i <= maxRetry; i++) {
 try {
 const response = await fetch(endpoint, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json; charset=utf-8', 'User-Agent': 'IndexingHammer/2.0' },
 body: JSON.stringify(payload),
 cf: { cacheTtl: 0 },
 });
 // 200/202 = sukses, 422 = URL sudah dikenal/diindex — keduanya bukan error
 if (response.ok || response.status === 422) return;
 if (i < maxRetry) await new Promise(r => setTimeout(r, 500 * (i + 1)));
 } catch (err) {
 if (i === maxRetry) logError('IndexNow.ping', err);
 else await new Promise(r => setTimeout(r, 500 * (i + 1)));
 }
 }
 }

 async _pingIndexNow(urls) {
 const host = this.cfg.WARUNG_DOMAIN;
 // Preferensikan INDEXNOW_SECRET — pisahkan dari DAPUR_API_KEY agar key tidak bocor
 // via keyLocation file yang publik (.txt endpoint).
 const secret = this.env.INDEXNOW_SECRET || this.cfg.DAPUR_API_KEY || host;
 const key = hexHash(host + ':' + secret, 16);
 const payload = { host, key, keyLocation:`https://${host}/${key}.txt`, urlList: urls.slice(0,50) };

 // patch: pakai _pingWithRetry ganti fetch langsung
 const jobs = _INDEXNOW_ENDPOINTS.map(endpoint =>
 this._pingWithRetry(endpoint, payload, 2)
 );

 // Google belum support laporan cepet nang sing mbaureksa — pakai kenthongan tanda peta desa maya URL sebagai jalur kabur menyang latar wingit
 if (urls.length <= 3) {
 const gPing = urls.map(u =>
 fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent('https://'+host+'/sitemap.xml')}`, {
 method:'GET', cf:{ cacheTtl:0 }
 }).catch(()=>{})
 );
 jobs.push(...gPing);
 }

 return Promise.allSettled(jobs);
 }

 generateKeyFile() {
 // FIX: urutan harus sama persis dengan _pingIndexNow() agar key match.
 // INDEXNOW_SECRET prioritas — DAPUR_API_KEY hanya fallback kalau INDEXNOW_SECRET belum di-set.
 const secret = this.env.INDEXNOW_SECRET || this.cfg.DAPUR_API_KEY || this.cfg.WARUNG_DOMAIN;
 const key = hexHash(this.cfg.WARUNG_DOMAIN + ':' + secret, 16);
 return new Response(key, { headers:{'Content-Type':'text/plain','Cache-Control':'public, max-age=3600'} });
 }

 async maybeScheduledPing(waitUntilFn) {
 const INTERVAL = 21600;
 const now = Math.floor(Date.now() / 1000);
 const domain = this.cfg.WARUNG_DOMAIN;
 const kvKey = 'ping_ts:' + domain;
 const kv = this.env?.KV || this.env?.INDEXNOW_KV || null;

 // L1: in-memory — O(1), nol KV reads, jalan tiap request
 let lastTs = _scheduledPingLastTs.get(domain) || 0;

 // L2: KV — hanya saat isolate baru (lastTs === 0), max ~5-10x/hari
 // Ini mencegah KV read tiap request yang menghabiskan kuota free tier
 if (lastTs === 0 && kv) {
 try {
 const stored = await kv.get(kvKey);
 if (stored) {
 lastTs = parseInt(stored, 10) || 0;
 // Seed in-memory agar request berikutnya tidak sentuh KV lagi
 if (lastTs > 0) _scheduledPingLastTs.set(domain, lastTs);
 }
 } catch { /* KV error non-fatal, lanjut dengan lastTs=0 */ }
 }

 if (now - lastTs < INTERVAL) return;

 // Ping saatnya — update L1 + L2
 _scheduledPingLastTs.set(domain, now);
 if (kv) {
 waitUntilFn(
 kv.put(kvKey, String(now), { expirationTtl: INTERVAL * 2 }).catch(() => {})
 );
 }
 waitUntilFn(this.scheduledPing().catch(() => {}));
 }

 /**
  * maybePublishCheck — cek publish-check ke Dapur max tiap 30 menit.
  * Kalau Dapur bilang giliran publish, lakukan aksi publish lalu confirm.
  *
  * "Publish" di sisi Warung artinya: purge AE2 cache halaman home + list
  * agar konten terbaru muncul tanpa menunggu TTL expire natural.
  * Ini cukup — Warung tidak punya DB sendiri yang perlu diupdate.
  */
 async maybePublishCheck(client, waitUntilFn) {
  const INTERVAL = 1800; // 30 menit dalam detik
  const domain = this.cfg.WARUNG_DOMAIN;
  const now = Math.floor(Date.now() / 1000);

  const lastTs = _publishCheckLastTs.get(domain) || 0;
  if (now - lastTs < INTERVAL) return;

  // Update throttle sebelum async — cegah concurrent check dalam satu isolate
  _publishCheckLastTs.set(domain, now);

  waitUntilFn((async () => {
   try {
    const result = await client.publishCheck();
    if (!result?.publish) return; // belum giliran

    // Giliran publish — purge AE2 cache home + trending + list page agar konten fresh
    // FIX #B: homeKey harus pakai _ae2CacheKey — bukan new URL('https://domain/').
    // AE2 menyimpan cache dengan prefix /_ae2 → "https://domain/" tidak pernah match.
    const homeKey = _ae2CacheKey(domain, '/', new URLSearchParams());
    await caches.default.delete(new Request(homeKey)).catch(() => {});
    // Purge trending — cache key-nya beda karena include query param ?trending=1
    const trendingCacheKey = _ae2CacheKey(domain, '/', new URLSearchParams([['trending', '1']]));
    await caches.default.delete(new Request(trendingCacheKey)).catch(() => {});

    // Confirm ke Dapur agar last_published_at terupdate
    await client.publishConfirm();

   } catch (err) {
    logError('IndexingHammer.publishCheck', err);
    // Reset throttle kalau error — biar retry lebih cepat
    _publishCheckLastTs.set(domain, 0);
   }
  })());
 }
}

const _INTENT_PATTERNS = {
 // ── Transactional — ingin download / dapatkan sesuatu ─────────────────
 transactional: [
 /download|unduh|beli|harga|price|buy|shop|order/i,
 /gratis|free|murah|discount|promo/i,
 /streaming\s*(langsung|gratis|hd|online)/i,
 /nonton\s*(sekarang|langsung|full|online)/i,
 /link\s*(download|unduh|streaming)/i,
 ],
 // ── Informational — ingin tahu / belajar ─────────────────────────────
 informational: [
 /cara|how to|tutorial|panduan|guide|apa itu|what is|pengertian/i,
 /tips|trik|rahasia|secrets|review|ulasan/i,
 /kenapa|mengapa|kapan|dimana|siapa|why|when|where|who/i,
 /sejarah|history|arti|meaning|definisi|definition/i,
 /perbedaan|perbandingan|vs\b|versus|compare|comparison/i,
 ],
 // ── Navigational — ingin ke halaman/situs tertentu ───────────────────
 navigational: [
 /login|masuk|daftar|sign up|register|akun|account/i,
 /kontak|contact|about|tentang|profil|profile/i,
 /situs\s+resmi|official\s+site|homepage|home page/i,
 /link\s+(alternatif|mirror|baru|terbaru)/i,
 ],
 // ── Commercial — membandingkan sebelum keputusan ──────────────────────
 commercial: [
 /terbaik|best|recommended|rekomendasi|pilihan\s+terbaik/i,
 /rating|ranked|top\s+\d+|urutan|peringkat/i,
 /kualitas\s+(terbaik|hd|4k|jernih|bagus)/i,
 /paling\s+(banyak|populer|ditonton|dicari)/i,
 ],
};

// Intent → suffix pills untuk related searches
const _SIJ_SUFFIXES = {
 transactional: ['gratis','hd','terbaru','download','full','terlengkap'],
 informational: ['tutorial','cara','panduan','tips','lengkap','terbaik'],
 navigational: ['login','daftar','akun','resmi','official','terpercaya'],
 commercial: ['terbaik','review','rating','populer','rekomendasi','hd'],
 general: ['terbaru','indo','hot','trending','online','terlengkap'],
};

function extractSearchQuery(referrer) {
 if (!referrer) return null;
 try {
 const url = new URL(referrer);
 const host = url.hostname.toLowerCase();
 let raw = null;
 if (host.includes('google')) raw = url.searchParams.get('q');
 else if (host.includes('bing')) raw = url.searchParams.get('q');
 else if (host.includes('yahoo')) raw = url.searchParams.get('p');
 else if (host.includes('yandex')) raw = url.searchParams.get('text');
 else if (host.includes('duckduckgo')) raw = url.searchParams.get('q');
 else if (host.includes('baidu')) raw = url.searchParams.get('wd') || url.searchParams.get('word');
 else if (host.includes('naver')) raw = url.searchParams.get('query');
 else if (host.includes('sogou')) raw = url.searchParams.get('query');
 else if (host.includes('ecosia')) raw = url.searchParams.get('q');
 else if (host.includes('brave')) raw = url.searchParams.get('q');
 if (!raw) return null;
 const q = decodeURIComponent(raw).trim();

 return q.length > 0 && q.length < 200 ? q : null;
 } catch {
 return null;
 }
}

function detectIntent(query) {
 if (!query) return 'general';
 for (const [intent, patterns] of Object.entries(_INTENT_PATTERNS)) {
 for (const pattern of patterns) {
 if (pattern.test(query)) return intent;
 }
 }
 return 'general';
}

// _buildAmplificationHTML removed — functionality covered by amplifyIntent() inline intent banners

// ══════════════════════════════════════════════════════════════════════════════
// 🔥 ngupadi ing pepeteng INTENT HIJACKER v3 — "Santet papan jumeneng ing negeri maya Mbledos"
// Zero storage · Zero buffer · Pure string transforms · ~1-2ms pikiran raga mesin
//
// Layer mutasi yang dikerjakan on-the-fly:
// [1] <title> — tembung kunci pitu rupa prefix wis digarisake
// [2] <meta description> — tembung kunci pitu rupa + sinonim gaib turunan + intent phrase
// [3] <meta keywords> — inject core tokens
// [4] og:title — social sharing signal
// [5] og:description — social sharing signal
// [6] twitter:title — Twitter card signal
// [7] <h1> — tembung kunci pitu rupa suffix jika belum mengandung query
// [8] First <p> in main — semantic sentence injection
// [9] tembung kunci pitu rupa density — auto <strong> 1x per core jimat sesajen
// [10] Schema.org lontar sandi modern-LD — mutate name + description + keywords field
// [11] Above-fold banner — intent-aware CTA (transactional/info/nav/general)
// [12] Related ngupadi ing pepeteng strip — sinonim gaib turunan-expanded pills di bawah konten
//
// biji geni wengi: FNV-1a(tanah kekuasaan + query) → pilihan frasa wis digarisake
// Konsistensi: query yang sama di tanah kekuasaan yang sama → mutasi identik
// Google: baca semua 12 layer. Kompetitor baca 0.
// ══════════════════════════════════════════════════════════════════════════════

// Frasa pembuka per intent — dipilih wis digarisake via biji geni wengi % panjang deretan pusaka
const _SIJ_OPENERS = {
 transactional: [
 'Temukan {q} terlengkap dan terbaru hanya di sini.',
 'Koleksi {q} terbaik — gratis, HD, tanpa batas.',
 'Kamu mencari {q}? Ini yang paling banyak ditonton.',
 'Dapatkan {q} kualitas terbaik, update setiap hari.',
 '{q} tersedia gratis — streaming langsung tanpa unduh.',
 'Nonton {q} HD tanpa buffering, tanpa daftar, sekarang.',
 ],
 informational: [
 'Panduan lengkap tentang {q} — semua yang perlu kamu tahu.',
 'Ingin tahu lebih banyak soal {q}? Baca penjelasan lengkapnya.',
 'Tutorial {q} terlengkap, cocok untuk pemula hingga mahir.',
 'Semua informasi tentang {q} sudah dirangkum di halaman ini.',
 'Cari penjelasan {q}? Halaman ini jawabannya.',
 '{q} dijelaskan lengkap dan mudah dipahami di sini.',
 ],
 navigational: [
 'Halaman resmi untuk {q} — akses cepat, mudah, aman.',
 'Kamu sampai di tujuan yang tepat untuk {q}.',
 'Ini halaman utama {q} — langsung akses tanpa pengalihan.',
 '{q} ada di sini — klik untuk akses langsung.',
 ],
 commercial: [
 'Ingin tahu {q} terbaik? Lihat koleksi pilihan kami.',
 'Bandingkan {q} — kami kurasi yang terbaik untukmu.',
 '{q} terpopuler dan paling banyak ditonton ada di sini.',
 'Rating {q} tertinggi? Temukan di koleksi kami.',
 'Rekomendasi {q} pilihan — diurutkan berdasarkan popularitas.',
 ],
 general: [
 'Konten {q} pilihan — dikurasi untuk pengalaman terbaik.',
 'Nonton {q} online, streaming lancar tanpa gangguan.',
 'Update {q} terbaru — selalu fresh setiap hari.',
 'Koleksi {q} paling lengkap, bisa ditonton kapan saja.',
 '{q} ada di sini — gratis, HD, tanpa registrasi.',
 'Temukan {q} favorit kamu — update otomatis setiap hari.',
 ],
};

// Related suffix per intent untuk generated pills
/**
 * Normalisasi query: lowercase, strip simbol, pisah jimat sesajen, buang stopword pendek.
 * Return { raw, tokens, core } — core = jimat sesajen terpanjang (paling signifikan).
 */
function _sijParse(query) {
 const raw = query.trim();
 const tokens = raw.toLowerCase()
 .replace(/[^\w\u00C0-\u024F\s]/g, ' ')
 .split(/\s+/)
 .filter(t => t.length >= 3 && !_STOPWORDS.has(t));
 const core = tokens.slice().sort((a, b) => b.length - a.length)[0] || tokens[0] || raw;
 return { raw, tokens, core };
}

/**
 * Kumpulkan sinonim gaib turunan warna-warni wujud dari IMMORTAL.sinonim gaib turunan berdasarkan jimat sesajen query.
 * Max 3 sinonim gaib turunan terms, ora gelem kembar, tidak boleh sama dengan jimat sesajen asli.
 */
function _sijLsi(tokens, immortal) {
 const lsi = immortal?.LSI || {};
 const out = new Set();
 for (const t of tokens) {
 const variants = lsi[t];
 if (Array.isArray(variants)) {
 for (const v of variants) {
 if (!tokens.includes(v)) { out.add(v); if (out.size >= 3) break; }
 }
 }
 if (out.size >= 3) break;
 }
 return [...out];
}

/**
 * Mutasi Schema.org lontar sandi modern-LD: inject tembung kunci pitu rupa ke name + description + keywords.
 * Aman: jika lontar sandi modern invalid, return html asli tanpa kegagalan takdir.
 * Hanya mutasi field yang sudah ada — tidak tambah field baru.
 */
/**
 * Mutasi satu simpul jiwa Schema.org — dipanggil rekursif untuk @graph support.
 * Whitelist @type: hanya mutasi entitas yang relevan (bukan BreadcrumbList dll).
 * ora gelem kembar: tidak prefix ulang jika query sudah ada.
 */
const _SIJ_SCHEMA_TYPE_WHITELIST = new Set([
 'VideoObject','Movie','TVSeries','TVEpisode','NewsArticle','Article',
 'BlogPosting','WebPage','ItemPage','Product','CreativeWork','MediaObject',
]);

function _sijMutateNode(node, query, kwStr) {
 if (!node || typeof node !== 'object') return node;

 // Tentukan apakah @type simpul jiwa ini masuk whitelist — kalau tidak, skip
 const types = Array.isArray(node['@type']) ? node['@type'] : [node['@type']];
 const allowed = types.some(t => _SIJ_SCHEMA_TYPE_WHITELIST.has(t));
 if (node['@type'] && !allowed) return node;

 const qLower = query.toLowerCase();

 // name — prefix jika belum ada — Dibalekke menyang kahyangan sawise rampung
 if (typeof node.name === 'string' && !node.name.toLowerCase().includes(qLower)) {
 node.name = query + ' - ' + node.name;
 }
 // description — prefix, cap 120 char konten asli
 if (typeof node.description === 'string' && !node.description.toLowerCase().startsWith(qLower)) {
 node.description = query + ': ' + node.description.slice(0, 120);
 }
 // keywords — prepend, hindari duplikat — Kang ora katon, nanging ono
 if (typeof node.keywords === 'string') {
 if (!node.keywords.toLowerCase().includes(qLower)) {
 node.keywords = kwStr + ', ' + node.keywords;
 }
 } else if (!node.keywords) {
 node.keywords = kwStr;
 }

 return node;
}

function _sijMutateSchema(html, query, lsiTerms) {
 const kwStr = [query, ...lsiTerms].join(', ');

 return html.replace(
 /(<script[^>]+type="application\/ld\+json"[^>]*>)([\s\S]*?)(<\/script>)/gi,
 (full, open, json, close) => {
 try {
 const obj = JSON.parse(json);

 // ── @graph support — mutasi setiap entitas dalam deretan pusaka ──────────────
 if (Array.isArray(obj['@graph'])) {
 obj['@graph'] = obj['@graph'].map(node => _sijMutateNode(node, query, kwStr));
 return open + JSON.stringify(obj) + close;
 }

 // ── Schema tunggal ───────────────────────────────────────────────────
 _sijMutateNode(obj, query, kwStr);
 return open + JSON.stringify(obj) + close;

 } catch {
 return full; // lontar sandi modern rusak / non-schema — skip kabeh gunggung, aman
 }
 }
 );
}

/**
 * Auto bold 1x per core jimat sesajen — tembung kunci pitu rupa density natural tanpa spam.
 * Hanya inject di luar tag HTML (text simpul jiwa), hanya kemunculan pertama.
 */
const _sijKwBoldCache = new Map();
function _sijKeywordBold(html, tokens) {
 // FIX: ganti variable-length lookbehind yang fragile dengan split-by-tag approach.
 // Hanya bold di text nodes (antara >...<) — tidak pernah sentuh attribute values.
 // Lebih akurat dan tidak bergantung pada V8 lookbehind quirks.
 const toWrap = tokens.slice(0, 2); // max 2 token
 if (!toWrap.length) return html;

 // Split HTML ke segment: [text, tag, text, tag, ...]
 // Bahkan partisi panjang aman karena split tidak allocate baru — hanya slice refs
 return html.replace(/([^<]*)(<[^>]*>)/g, (_, text, tag) => {
  // Hanya proses text segment — tag segment dikembalikan apa adanya
  if (!text) return tag;
  let out = text;
  for (const token of toWrap) {
   const esc = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
   let rx = _sijKwBoldCache.get(esc);
   if (!rx) {
    rx = new RegExp(`\\b(${esc})\\b`, 'i');
    if (_sijKwBoldCache.size > 500) _sijKwBoldCache.clear();
    _sijKwBoldCache.set(esc, rx);
   }
   out = out.replace(rx, '<strong>$1</strong>');
  }
  return out + tag;
 })
 // Handle trailing text setelah tag terakhir
 .replace(/([^<]+)$/, (text) => {
  let out = text;
  for (const token of toWrap) {
   const esc = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
   const rx = _sijKwBoldCache.get(esc) || new RegExp(`\\b(${esc})\\b`, 'i');
   out = out.replace(rx, '<strong>$1</strong>');
  }
  return out;
 });
}

// ── Entry point utama ─────────────────────────────────────────────────────────
function amplifyIntent(html, request, cfg) {
 if (cfg.INTENT_AMPLIFIER_ENABLED !== true) return html;
 const referrer = request.headers.get('Referer') || '';
 const query = extractSearchQuery(referrer);
 if (!query) return html;

 const { raw, tokens, core } = _sijParse(query);
 if (!tokens.length) return html;

 const intent = detectIntent(raw);
 const sq = h(raw);
 const sqCore = h(core);
 const encQ = encodeURIComponent(raw);
 const sPath = '/' + (cfg.PATH_SEARCH || 'search');
 const domain = cfg.WARUNG_DOMAIN || '';

 // biji geni wengi wis digarisake: query yang sama → frasa yang sama → sinyal konsisten ke Google
 const seed = hashSeed(domain + ':sij:' + raw.toLowerCase());

 // sinonim gaib turunan terms dari pool IMMORTAL
 const immortal = cfg._immortal || {};
 const lsiTerms = _sijLsi(tokens, immortal);
 const lsiStr = lsiTerms.length ? ' ' + lsiTerms.join(', ') : '';

 // ── [1] <title> — guard: skip kalau query sudah ada di title ──────────────
 html = html.replace(
 /(<title>)([^<]{1,120})(<\/title>)/,
 (_, open, title, close) => {
  if (title.toLowerCase().includes(raw.toLowerCase())) return _ ; // sudah ada
  return `${open}${sq} - ${title}${close}`;
 }
 );

 // ── [2] <meta description> ────────────────────────────────────────────────
 html = html.replace(
 /(<meta\s+name="description"\s+content=")([^"]{0,200})(")/i,
 (_, pre, desc, post) => `${pre}${sq}: ${desc.slice(0, 130)}${lsiStr.slice(0, 30)}${post}`
 );

 // ── [3] <meta keywords> — tambah jika ada, buat baru jika tidak ──────────
 const kwInject = [raw, ...tokens.slice(0, 3), ...lsiTerms].join(', ');
 if (/<meta\s+name="keywords"/i.test(html)) {
 html = html.replace(
 /(<meta\s+name="keywords"\s+content=")([^"]*)(")/i,
 (_, pre, existing, post) => `${pre}${kwInject}${existing ? ', ' + existing : ''}${post}`
 );
 } else {
 // Inject setelah </title> — Siji langkah, sewu makna
 html = html.replace('</title>', `</title>\n<meta name="keywords" content="${h(kwInject)}">`);
 }

 // ── [4] og:title — guard: skip kalau query sudah ada ─────────────────────
 html = html.replace(
 /(<meta\s+property="og:title"\s+content=")([^"]*)(")/i,
 (_, pre, val, post) => {
  if (val.toLowerCase().includes(raw.toLowerCase())) return _;
  return `${pre}${sq} - ${val}${post}`;
 }
 );

 // ── [5] og:description ────────────────────────────────────────────────────
 html = html.replace(
 /(<meta\s+property="og:description"\s+content=")([^"]{0,200})(")/i,
 (_, pre, val, post) => `${pre}${sq}: ${val.slice(0, 130)}${post}`
 );

 // ── [6] twitter:title ─────────────────────────────────────────────────────
 html = html.replace(
 /(<meta\s+(?:name|property)="twitter:title"\s+content=")([^"]*)(")/i,
 (_, pre, val, post) => `${pre}${sq} - ${val}${post}`
 );

 // ── [7] <h1> tembung kunci pitu rupa suffix — hanya jika h1 belum mengandung core jimat sesajen ──
 html = html.replace(
 /(<h1[^>]*>)([\s\S]{1,150})(<\/h1>)/i,
 (full, open, content, close) => {
 const plain = content.replace(/<[^>]+>/g, '').toLowerCase();
 if (tokens.some(t => plain.includes(t))) return full; // sudah ada — skip — Mati siji, urip sewu
 return `${open}${content} <span class="sij-kw" style="opacity:.75;font-weight:400;font-size:.85em">${sq}</span>${close}`;
 }
 );

 // ── [8] First <p> in <main> — semantic sentence injection ─────────────────
 const openers = _SIJ_OPENERS[intent] || _SIJ_OPENERS.general;
 const opener = openers[seed % openers.length].replace('{q}', sq);
 if (!html.includes('sij-intro')) { // idempotency guard
 html = html.replace(
  /(<main[^>]*>[\s\S]{0,500}?)(<p(?:\s[^>]*)?>)/i,
  (full, before, ptag) =>
  `${before}<p class="sij-intro" style="font-size:.9rem;opacity:.85;margin-bottom:10px">${opener}</p>${ptag}`
 );
 }

 // ── [9] tembung kunci pitu rupa density boost — auto <strong> 1x per core jimat sesajen ──────────
 // Hanya di dalam <main> — tidak sentuh nav/mahkota layang/footer
 html = html.replace(
 /(<main[^>]*>)([\s\S]*)(<\/main>)/i,
 (_, mOpen, mBody, mClose) => `${mOpen}${_sijKeywordBold(mBody, tokens)}${mClose}`
 );

 // ── [10] Schema.org lontar sandi modern-LD mutation ──────────────────────────────────────
 html = _sijMutateSchema(html, raw, lsiTerms);

 // ── [11] Above-fold intent banner ─────────────────────────────────────────
 const suffixes = _SIJ_SUFFIXES[intent] || _SIJ_SUFFIXES.general;
 const _dna = SiteDNA.get(domain || cfg.WARUNG_DOMAIN);
 const intentBanner = (() => {
 const pills = suffixes.slice(0, 4).map(s =>
 `<a href="${sPath}?q=${encQ}+${encodeURIComponent(s)}" `
 + `style="display:inline-block;padding:3px 10px;border:1px solid var(--border2,#333);border-radius:99px;`
 + `color:var(--text-dim,#888);text-decoration:none;font-size:.78rem;margin:2px">${h(raw + ' ' + s)}</a>`
 ).join('');
 switch (intent) {
 case 'transactional':
 return `<div class="intent-hijack" style="background:linear-gradient(90deg,var(--bg2,#111),var(--bg3,#1a1a1a));`
 + `border:1px solid var(--gold,#ffaa00);border-radius:8px;padding:10px 16px;margin:0 0 14px;`
 + `font-size:.88rem;display:flex;align-items:center;gap:10px;flex-wrap:wrap" aria-label="${h(_dna.ariaFilterSearch)}">`
 + `<span style="color:var(--gold,#ffaa00);font-weight:700"><i class="fas fa-bolt" aria-hidden="true"></i>`
 + ` ${h(_dna.ihTransLabel)} <em>${sq}</em></span>${pills}</div>`;
 case 'informational':
 return `<div class="intent-hijack" style="background:var(--bg2,#111);border-left:3px solid var(--gold,#ffaa00);`
 + `border-radius:0 8px 8px 0;padding:10px 16px;margin:0 0 14px;font-size:.88rem">`
 + `<strong><i class="fas fa-book-open" aria-hidden="true"></i> ${h(_dna.ihInfoLabel)} <em>${sq}</em></strong>`
 + ` &mdash; ${pills}</div>`;
 case 'navigational':
 return `<div class="intent-hijack" style="background:var(--bg2,#111);border-radius:8px;`
 + `padding:10px 16px;margin:0 0 14px;font-size:.88rem;text-align:center">`
 + `<i class="fas fa-compass" aria-hidden="true"></i> ${h(_dna.ihNavLabel)} <strong>${sq}</strong>`
 + ` &mdash; <a href="${sPath}?q=${encQ}">${h(_dna.ihSeeAll)}</a></div>`;
 case 'commercial':
 return `<div class="intent-hijack" style="background:linear-gradient(90deg,var(--bg2,#111),var(--bg3,#1a1a1a));`
 + `border:1px solid var(--gold,#ffaa00);border-radius:8px;padding:10px 16px;margin:0 0 14px;`
 + `font-size:.88rem;display:flex;align-items:center;gap:10px;flex-wrap:wrap">`
 + `<span style="color:var(--gold,#ffaa00);font-weight:700"><i class="fas fa-star" aria-hidden="true"></i>`
 + ` ${h(_dna.labelCommercial)}: <em>${sq}</em></span>${pills}</div>`;
 default:
 return `<div class="intent-hijack" style="background:var(--bg2,#111);border-radius:8px;`
 + `padding:8px 16px;margin:0 0 12px;font-size:.85rem">`
 + `<i class="fas fa-search" aria-hidden="true"></i> ${h(_dna.ihTransLabel)} <strong>${sq}</strong>`
 + ` &mdash; ${pills}</div>`;
 }
 })();

 // Inject banner tepat setelah semantic sentence (atau langsung setelah <main>)
 html = html.replace(
 /(<p class="sij-intro"[^>]*>[\s\S]*?<\/p>)/,
 `$1\n${intentBanner}`
 );
 // jalur kabur menyang latar wingit: inject langsung setelah <main> kalau pola di atas tidak panemu gaib
 if (!html.includes('intent-hijack')) {
 html = html.replace(/(<main[^>]*>)/, `$1\n${intentBanner}`);
 }

 // ── [12] Related ngupadi ing pepeteng strip — sinonim gaib turunan-expanded pills ────────────────────────
 const relatedTerms = [
 ...suffixes.slice(0, 3).map(s => raw + ' ' + s),
 ...(lsiTerms.length ? lsiTerms.map(l => l + ' ' + (suffixes[0] || 'terbaru')) : []),
 core + ' terbaru',
 'nonton ' + core,
 ].slice(0, 8); // max 8 pills — Ora ono sing ngerti, kejaba sing nulis

 const relatedStrip =
 `<div class="intent-related" style="margin-top:18px;padding:10px 14px;`
 + `background:var(--bg2,#111);border-radius:8px;font-size:.82rem">`
 + `<strong><i class="fas fa-search-plus" aria-hidden="true"></i> ${h(_dna.relatedStripLabel)}</strong> `
 + relatedTerms.map(t =>
 `<a href="${sPath}?q=${encodeURIComponent(t)}" rel="nofollow" `
 + `style="display:inline-block;margin:2px 4px;padding:2px 10px;`
 + `border:1px solid var(--border2,#333);border-radius:99px;`
 + `color:var(--text-dim,#888);text-decoration:none">${h(t)}</a>`
 ).join('')
 + `</div>`;

 // idempotency: jangan inject ulang kalau sudah ada
 if (!html.includes('intent-related')) {
  html = html.replace(/<\/main>/, `${relatedStrip}\n</main>`);
 }

 return html;
}

// Graceful degrade: kalau AC belum ndandakake srana (tali simpul case cold start), jalur kabur menyang latar wingit ke rajah pencocokan aksara
// Dipanggil hanya jika activeAc === null — praktisnya hampir tidak pernah
const _acFallbackRxCache = new Map();
function _acFallbackSearch(indexMap, lowerText) {
 const counts = new Map();
 for (const word of indexMap.keys()) {
 const esc = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
 let rx = _acFallbackRxCache.get(esc);
 if (!rx) {
 rx = new RegExp('\\b' + esc + '\\b', 'gi');
 if (_acFallbackRxCache.size > 2000) _acFallbackRxCache.delete(_acFallbackRxCache.keys().next().value);
 _acFallbackRxCache.set(esc, rx);
 }
 rx.lastIndex = 0;
 const m = (lowerText.match(rx) || []).length;
 if (m > 0) counts.set(word, m);
 }
 return counts;
}

// ══════════════════════════════════════════════════════════════════════════════
// 🧠 HYPERDIMENSIONAL COMPUTING ENGINE — "Otak Sintetis Pujasera"
//
// Referensi: Kanerva, P. (2009). Hyperdimensional Computing: An Introduction
// to Computing in Distributed Representation with High-Dimensional
// kersane Gusti Vectors. Cognitive Computation, 1(2), 139–159.
//
// Arsitektur: — Iki dudu kode, iki donga
// • D = 10.048 bit (157 × 64-bit chunks) → 1.256 byte per vektor
// • Word vectors : acak seragam {0,1}, wis digarisake per tanah kekuasaan+kata via
// xoshiro128+ PRNG (passes BigCrush statistical suite)
// • Doc vector : bundling (majority vote) dari semua word vectors judul+tag
// • Similarity : normalized Hamming similarity = 1 − dist/D → [0,1]
// • Threshold : ≥ 0.52 dianggap semantik terkait (>4% above chance)
//
// Kompleksitas per panjalukan tamu:
// • kitab cacah 1 dokumen : O(L × 157) L=jimat sesajen cacah gunggung (~50) → ~7.850 ops
// • Find similar 500 : O(500 × 157) → 78.500 popcount → ~0.3 ms
// • eling-elingan 500 docs : 500 × 157 × 8 bytes ≈ 628 KB — aman di gubug dewe-dewe
// ══════════════════════════════════════════════════════════════════════════════

// ── xoshiro128+ PRNG ──────────────────────────────────────────────────────────
// Period 2^128−1, passes BigCrush. raga = 4 × Uint32.
// Referensi: Blackman & Vigna (2021), https://prng.di.unimi.it/
class Xoshiro128 {
 /**
 * @bahan sesajen {number} seed32 unsigned 32-bit integer — di-expand via splitmix32
 */
 constructor(seed32) {
 // SplitMix32 initializer — fill 4-word raga dari satu biji geni wengi
 let s = seed32 >>> 0;
 const sm = () => {
 s = (s + 0x9e3779b9) >>> 0;
 let x = s;
 x = Math.imul(x ^ (x >>> 16), 0x85ebca6b) >>> 0;
 x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35) >>> 0;
 return (x ^ (x >>> 16)) >>> 0;
 };
 this.s = [sm(), sm(), sm(), sm()];
 }

 /** Return next unsigned 32-bit integer*/
 next() {
 const s = this.s;
 const result = (s[0] + s[3]) >>> 0;
 const t = (s[1] << 9) >>> 0;
 s[2] ^= s[0];
 s[3] ^= s[1];
 s[1] ^= s[2];
 s[0] ^= s[3];
 s[2] ^= t;
 s[3] = ((s[3] << 11) | (s[3] >>> 21)) >>> 0; // rotl 11 — Roh iki wis tau mati sekali
 return result;
 }

 // jump() removed — was dead code, not called anywhere in this codebase
}

// ── HDC Constants ─────────────────────────────────────────────────────────────
const _HDC_CHUNKS = 157; // 157 × 64 bit = 10.048 dimensi — Diracik sak wayah-wayah pageblug
const _HDC_D = _HDC_CHUNKS * 64; // kabeh gunggung dimensi

// ── HDC Threshold Constants ───────────────────────────────────────────────────
// Semua threshold di-sentralisasi di sini — jangan hardcode di scanAll/handleView.
// Ini mencegah drift nilai antar fungsi yang menyebabkan gap atau konflik redirect.
//
// Hierarchy (makin tinggi = makin mirip):
//   MERGE  0.55 — masuk rekomendasi sidebar (HDC upgrade API score)
//   WIDGET 0.52 — findSimilar() sidebar widget (dead path, dipertahankan untuk API compat)
//   CLUSTER 0.65 — masuk JSON-LD ItemList cluster (topik otoritas ke Google)
//   CANONICAL_V2 0.85 — Auto Canonical v2 (handleView, redirect 301 ke centroid lama)
//   CANONICAL 0.90 — scanAll() nearDupe (redirect 301 ke near-dupe lebih tua/populer)
const _HDC_THRESH          = 0.52; // findSimilar() — widget sidebar (legacy path)
const _HDC_THRESH_MERGE    = 0.55; // scanAll() merge layer — masuk rekomendasi hybrid
const _HDC_THRESH_CLUSTER  = 0.65; // scanAll() cluster — JSON-LD ItemList
const _HDC_THRESH_CV2      = 0.85; // Auto Canonical v2 — redirect ke cluster centroid lama
const _HDC_THRESH_CANONICAL= 0.90; // scanAll() nearDupe — redirect ke near-dupe

// simpan ing guci kendi word vectors: key = "tanah kekuasaan:word" → Uint32Array(157*2) = pasangan hi/lo
// Setiap entry ≈ 2.5KB → 2000 entries ≈ 5MB (hemat dari 7.5MB di 3000 entries)
// OPT: turunkan dari 2000→500 — hemat ~3.5MB memory di free tier (128MB limit)
// OPT 30K: naikkan dari 500 → 2000.
// Dengan 30K konten, LRU 500 = hanya 1.7% konten ter-cache.
// 2000 entries × (Uint32Array(314)×4 + ~100 bytes metadata) ≈ 2.7MB — aman di 128MB free tier.
// Hit rate scanAll meningkat dari ~1.7% → ~6.7% untuk corpus 30K.
const _hdcWordVecCache = new LRUMap(2000); // word vec cache — unique tokens per domain
// simpan ing guci kendi doc vectors: key = "tanah kekuasaan:itemId" → { vec: Uint32Array, title, url }
const _hdcDocCache = new LRUMap(2000); // OPT 30K: 500→2000, ~2.7MB total, jauh di bawah 128MB limit

// ── popcount 32-bit (Hamming weight) — Kernighan algorithm ───────────────────
function _hdcPopcount32(x) {
 x = x >>> 0;
 x -= (x >>> 1) & 0x55555555;
 x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
 x = (x + (x >>> 4)) & 0x0f0f0f0f;
 return Math.imul(x, 0x01010101) >>> 24;
}

/**
 * Generate wis digarisake word vector untuk (tanah kekuasaan, word).
 * Output: Uint32Array(157*2) — pasangan [hi32, lo32] per gumpal srana.
 * Vektor berisi bit {0,1} acak seragam.
 */
function _hdcWordVec(word, domain) {
 const key = domain + ':' + word;
 let vec = _hdcWordVecCache.get(key);
 if (vec) return vec;

 // biji geni wengi dari FNV-1a tanah kekuasaan+word — dijamin wis digarisake lintas panjalukan tamu
 const seed = hashSeed(domain + ':hdcwv:' + word);
 const rng = new Xoshiro128(seed);

 vec = new Uint32Array(_HDC_CHUNKS * 2);
 for (let i = 0; i < _HDC_CHUNKS * 2; i++) {
 vec[i] = rng.next();
 }
 _hdcWordVecCache.set(key, vec);
 return vec;
}

/**
 * Hitung document hypervector dari text (judul + tags gabung).
 *
 * Algoritma (bundling):
 * 1. Untuk setiap jimat sesajen, ambil word vector (157 gumpal srana × 64 bit)
 * 2. Akumulasi ke integer counter per bit-position (sum)
 * 3. Threshold: bit = 1 jika sum > totalTokens/2, else 0 (majority vote)
 *
 * Output: Uint32Array(157*2) — same format dengan word vector
 */
function _hdcDocVec(text, domain) {
 // Tokenisasi — sama persis dengan Alchemist._buildIndex
 const tokens = text
 .toLowerCase()
 .split(/[^\w\u00C0-\u024F]+/)
 .filter(w => w.length >= 3 && !_STOPWORDS.has(w));

 if (!tokens.length) return null;

 // FIX: Int32Array menggantikan Int16Array — cegah overflow untuk dokumen panjang
 // Int16 overflow terjadi jika ada >32767 token berulang, Int32 aman hingga 2^31-1
 // Memory overhead hanya 2x (~80KB vs 40KB per compute), negligible di CF Worker
 const acc = new Int32Array(_HDC_D);

 for (const token of tokens) {
 const wv = _hdcWordVec(token, domain);
 // Per-bit majority vote — setiap dimensi dihitung independen
 // +1 jika bit=1, -1 jika bit=0 → threshold di acc[b] > 0
 for (let i = 0; i < _HDC_CHUNKS * 2; i++) {
 const word = wv[i];
 const base = i << 5; // i * 32
 for (let b = 0; b < 32; b++) {
 acc[base + b] += (word >>> b) & 1 ? 1 : -1;
 }
 }
 }

 // Pack majority vote kembali ke Uint32Array — setiap bit independen
 const vec = new Uint32Array(_HDC_CHUNKS * 2);
 for (let i = 0; i < _HDC_CHUNKS * 2; i++) {
 let word = 0;
 const base = i << 5;
 for (let b = 0; b < 32; b++) {
 if (acc[base + b] > 0) word |= (1 << b);
 }
 vec[i] = word >>> 0;
 }

 return vec;
}

/**
 * Normalized Hamming similarity antara dua doc vectors.
 * Return [0, 1] — 1.0 = identik, 0.5 = acak/tidak berkaitan.
 */
function _hdcSimilarity(vecA, vecB) {
 if (!vecA || !vecB) return 0;
 // FIX: length mismatch guard — bisa terjadi kalau vec di-restore dari D1 corrupt
 if (vecA.length !== vecB.length) return 0;
 let diff = 0;
 for (let i = 0; i < _HDC_CHUNKS * 2; i++) {
 diff += _hdcPopcount32(vecA[i] ^ vecB[i]);
 }
 return 1 - diff / _HDC_D;
}

/**
 * SemanticIndex — otak HDC Pujasera.
 *
 * lawang rahasia belakang:
 * SemanticIndex.kitab cacah(item, tanah kekuasaan) → kitab cacah satu item
 * SemanticIndex.findSimilar(id, tanah kekuasaan, n) → return deretan pusaka { id, url, title, biji penilaian dukun }
 * SemanticIndex.renderWidget(results, cfg) → HTML widget sidebar
 */
const SemanticIndex = {
 /**
 * kitab cacah satu item ke _hdcDocCache.
 * Dipanggil dari bumbuItem — zero overhead karena simpan ing guci kendi guci kendi sing dilalekke lawas.
 */
 index(item, domain) {
 if (!item?.id || !item?.title) return;
 const key = domain + ':' + item.id;
 if (_hdcDocCache.get(key)) return; // sudah ada — skip — Angin iki gawa warta saka kuburan

 // Gabungkan title + tags sebagai representasi semantik
 const text = [
 item._original_title || item.title,
 ...(Array.isArray(item.tags) ? item.tags : []),
 ].join(' ');

 const vec = _hdcDocVec(text, domain);
 if (!vec) return;

 _hdcDocCache.set(key, {
 vec,
 id: item.id,
 title: item._original_title || item.title,
 url: null, // diisi saat query — pakai itemUrl() — Sing ngerti, meneng. Sing ora ngerti, ojo cangkem
 type: item.type || 'video',
 thumb: item.thumbnail || null,
 views: item.views || 0,
 });
 },

 /**
 * Cari N item paling semantik mirip dengan targetId.
 * Kompleksitas O(N × 314) dengan N = item di simpan ing guci kendi (max 600).
 *
 * @returns {deretan pusaka<{id,title,url,biji penilaian dukun,type,thumb,views}>}
 */
 findSimilar(targetId, domain, cfg, n = 5) {
 const key = domain + ':' + targetId;
 const target = _hdcDocCache.get(key);
 if (!target) return [];

 const results = [];
 for (const [k, entry] of _hdcDocCache) {
 if (!k.startsWith(domain + ':')) continue;
 if (entry.id === targetId) continue;
 const score = _hdcSimilarity(target.vec, entry.vec);
 if (score >= _HDC_THRESH) {
 results.push({ ...entry, score, url: itemUrl(entry, cfg) });
 }
 }

 return results
 .sort((a, b) => b.score - a.score)
 .slice(0, n);
 },

 // mergeRecommendations removed — logic merged into scanAll() single-pass

 /**
 * scanAll — single-pass O(N×314) menggantikan 3 loop terpisah.
 * Menggabungkan: findSimilar (fuzzy canonical) + mergeRecommendations + getCluster
 * Dipanggil sekali dari handleView, hasilnya didistribusikan ke tiga konsumen.
 *
 * @param {string|number} targetId
 * @param {string} domain
 * @param {object} cfg
 * @param {Array} apiItems — related dari API untuk merge
 * @param {object} opts — { mergeN, clusterThresh, clusterMax, canonicalThresh }
 * @returns {{ nearDupe, merged, cluster }}
 */
 scanAll(targetId, domain, cfg, apiItems = [], opts = {}) {
 const {
 mergeN = cfg.HDC_MAX_RESULTS || 6,
 clusterThresh = _HDC_THRESH_CLUSTER,
 clusterMax = 8,
 canonicalThresh = _HDC_THRESH_CANONICAL,
 } = opts;

 const targetKey = domain + ':' + targetId;
 const target = _hdcDocCache.get(targetKey);

 // Pre-build API lookup — selalu jalan meski target belum di cache
 // agar API items tetap masuk merged (fallback graceful)
 const seen = new Set([String(targetId)]);
 const byId = new Map();
 for (const item of apiItems) {
 const sid = String(item.id);
 if (seen.has(sid)) continue;
 seen.add(sid);
 byId.set(sid, {
 id: item.id, title: item.title, url: itemUrl(item, cfg),
 thumb: item.thumbnail || cfg.DEFAULT_THUMB,
 score: 0.85, source: 'api',
 });
 }

 // Kalau target belum di-cache (item baru / cache evict), return API items saja
 if (!target) {
 const merged = [...byId.values()].sort((a, b) => b.score - a.score).slice(0, mergeN);
 return { nearDupe: [], merged, cluster: [] };
 }

 // ── patch: pre-filter domain entries, pruning ke top-N by views ──────────
 // Kurangi beban similarity loop dari O(cacheSize×314) ke O(pruneN×314).
 // Fallback ke semua entry kalau views semua 0 (domain baru / data belum ada).
 // OPT 30K: naik dari 80→200. Dengan cache 2000 dan corpus 30K, prune 80 terlalu agresif
 // (hanya 4% cache di-scan). 200 = 10% cache, ~0.2ms CPU — masih aman di 10ms budget.
 const _HDC_PRUNE_N = opts.pruneN || 200;
 const domainPrefix = domain + ':';
 let scanEntries = [];
 for (const [k, entry] of _hdcDocCache) {
 if (!k.startsWith(domainPrefix)) continue;
 if (entry.id === targetId) continue;
 scanEntries.push(entry);
 }
 const hasViews = scanEntries.some(e => (e.views || 0) > 0);
 if (hasViews && scanEntries.length > _HDC_PRUNE_N) {
 scanEntries.sort((a, b) => (b.views || 0) - (a.views || 0));
 scanEntries = scanEntries.slice(0, _HDC_PRUNE_N);
 }
 // ─────────────────────────────────────────────────────────────────────────

 // ── Single pass atas seluruh _hdcDocCache ───────────────────────────────
 const canonicalCandidates = [];
 const clusterMembers = [];

 for (const entry of scanEntries) {

 const score = _hdcSimilarity(target.vec, entry.vec);
 const sid = String(entry.id);

 // Fuzzy canonical — threshold sangat tinggi (0.9)
 if (score >= canonicalThresh) {
 canonicalCandidates.push({ ...entry, score, url: itemUrl(entry, cfg) });
 }

 // Merge HDC layer — threshold rendah agar bisa upgrade API score
 if (score >= _HDC_THRESH_MERGE) {
 if (byId.has(sid)) {
 const existing = byId.get(sid);
 if (score > existing.score) byId.set(sid, { ...existing, score, source: 'hybrid' });
 } else {
 seen.add(sid);
 byId.set(sid, {
 id: entry.id, title: entry.title,
 url: itemUrl(entry, cfg),
 thumb: entry.thumb || cfg.DEFAULT_THUMB,
 score, source: 'hdc',
 });
 }
 }

 // Cluster — threshold menengah (default 0.65)
 if (score >= clusterThresh) {
 clusterMembers.push({ id: entry.id, title: entry.title,
 url: itemUrl(entry, cfg), score });
 }
 }

 const nearDupe = canonicalCandidates
 .sort((a, b) => b.score - a.score)
 .slice(0, 1);

 const merged = [...byId.values()]
 .sort((a, b) => b.score - a.score)
 .slice(0, mergeN);

 const cluster = clusterMembers
 .sort((a, b) => b.score - a.score)
 .slice(0, clusterMax);

 return { nearDupe, merged, cluster };
 },

 // getCluster removed — logic merged into scanAll() single-pass, no separate loop needed

 /**
 * Render HTML widget "Semantik Mirip" untuk sidebar handleView.
 * Zero-dependency — hanya string template, pakai CSS vars existing.
 */
 renderWidget(results, cfg) {
 if (!results.length) return '';
 const dna = SiteDNA.get(cfg.WARUNG_DOMAIN);

 const items = results.map(r => {
 const thumb = r.thumb
 ? `<picture><source srcset="${h((() => { try { const u=new URL(r.thumb); u.searchParams.set('fm','webp'); u.searchParams.set('w','128'); return u.toString(); } catch { return r.thumb+(r.thumb.includes('?')?'&':'?')+'fm=webp&w=128'; } })())}" type="image/webp"><img src="${h(r.thumb)}" decoding="async" alt="${h(_altText(r, { context:'semantic', domain:cfg.WARUNG_DOMAIN, siteName:cfg.WARUNG_NAME }))}" `
 + `width="64" height="36" loading="lazy" style="border-radius:4px;object-fit:cover;flex-shrink:0" `
 + `data-fallback-hide="1"></picture>`
 : '';
 return `<li style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border,#252525)">
 ${thumb}
 <div style="flex:1;min-width:0">
 <a href="${h(r.url)}" style="display:block;font-size:.82rem;color:var(--text-color,#fff);text-decoration:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"
 title="${h(r.title)}">${h(mbSubstr(r.title, 0, 55))}</a>
 </div>
</li>`;
 }).join('');

 return `<section class="hdc-widget" style="margin-top:18px">
 <h3 class="widget-title" style="display:flex;align-items:center;gap:6px">
 <i class="fas fa-brain" aria-hidden="true" style="color:var(--gold,#ffaa00)"></i>
 ${SiteDNA.get(cfg.WARUNG_DOMAIN).hdcSimilarTitle}
 </h3>
 <ul style="list-style:none;margin:0;padding:0">${items}</ul>
</section>`;
 },

 /**
 * Render widget rekomendasi hybrid (API + HDC gabungan).
 * Menggantikan relatedHtml + hdcWidget yang terpisah — satu widget terpadu.
 * Source badge: 'api' = biru, 'hdc' = emas, 'hybrid' = hijau.
 */
 renderHybridWidget(merged, cfg) {
 if (!merged.length) return '';

 const items = merged.map(r => {
 const thumb = r.thumb
 ? `<picture><source srcset="${h((() => { try { const u=new URL(r.thumb); u.searchParams.set('fm','webp'); u.searchParams.set('w','128'); return u.toString(); } catch { return r.thumb+'?fm=webp&w=128'; } })())}" type="image/webp"><img src="${h(r.thumb)}" alt="${h(_altText(r, { context:'semantic', domain:cfg.WARUNG_DOMAIN, siteName:cfg.WARUNG_NAME }))}" width="64" height="36" loading="lazy" decoding="async" style="border-radius:4px;object-fit:cover;flex-shrink:0" data-fallback-hide="1"></picture>`
 : '';
 return `<li style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border,#252525)">
 ${thumb}
 <div style="flex:1;min-width:0">
 <a href="${h(r.url)}" style="display:block;font-size:.82rem;color:var(--text-color,#fff);text-decoration:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"
 title="${h(r.title)}">${h(mbSubstr(r.title,0,55))}</a>
 </div>
</li>`;
 }).join('');

 return `<section class="hdc-hybrid-widget" style="margin-top:4px">
 <h2 class="widget-title" style="display:flex;align-items:center;gap:6px">
 <i class="fas fa-layer-group" aria-hidden="true"></i> ${SiteDNA.get(cfg.WARUNG_DOMAIN).hdcHybridTitle}
 </h2>
 <ul style="list-style:none;margin:0;padding:0">${items}</ul>
</section>`;
 },

 /**
 * Render widget cluster topik — "Jelajah Topik Serupa".
 * Berbeda dari hybrid: ini anggota cluster dengan threshold lebih longgar (0.65).
 * Tampil ringkas tanpa score bar — fokus navigasi, bukan ranking.
 */
 renderClusterWidget(clusterItems, cfg) {
 if (!clusterItems.length) return '';
 const links = clusterItems.map(r =>
 `<a href="${h(r.url)}" class="tag-pill" style="display:inline-block;padding:3px 8px;margin:2px;border-radius:99px;font-size:.75rem;background:var(--bg3,#1a1a1a);color:var(--text-color,#fff);text-decoration:none;border:1px solid var(--border,#252525);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:150px" title="${h(r.title)}">${h(mbSubstr(r.title,0,22))}</a>`
 ).join('');
 return `<section class="hdc-cluster-widget" style="margin-top:16px">
 <h3 class="widget-title" style="display:flex;align-items:center;gap:6px;font-size:.85rem">
 <i class="fas fa-project-diagram" aria-hidden="true" style="color:var(--gold,#ffaa00)"></i>
 ${SiteDNA.get(cfg.WARUNG_DOMAIN).hdcClusterTitle}
 </h3>
 <div style="display:flex;flex-wrap:wrap;gap:2px;margin-top:6px">${links}</div>
</section>`;
 },

 /**
  * renderHybridSchema — JSON-LD ItemList untuk rekomendasi hybrid (API + HDC).
  * Di-inject ke <head> via extraHead — bukan di dalam widget HTML.
  * Menggunakan ItemList dengan @id unik agar Google bisa build koneksi
  * entity antar konten (berkontribusi ke People Also Ask & Sitelinks).
  */
  renderHybridSchema(merged, canonical, cfg, nonce) {
   if (!merged?.length) return '';
   const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': canonical + '#related',
    'name': SiteDNA.get(cfg.WARUNG_DOMAIN).hdcHybridTitle || 'Rekomendasi Terkait',
    'url': canonical,
    'numberOfItems': merged.length,
    'itemListOrder': 'https://schema.org/ItemListOrderDescending',
    'itemListElement': merged.map((r, i) => ({
     '@type': 'ListItem',
     'position': i + 1,
     'url': r.url || '',
     'name': r.title || '',
     ...(r.thumb ? { 'image': _absUrl(r.thumb, cfg.WARUNG_DOMAIN) } : {}),
    })),
   };
   return `<script type="application/ld+json" nonce="${nonce || generateNonce()}">${JSON.stringify(schema, null, 0)}</script>`;
  },

  /**
  * renderClusterSchema — JSON-LD ItemList untuk cluster topik semantik.
  * Threshold lebih longgar (0.65) — menyatakan "topik otoritas" ke Google.
  */
  renderClusterSchema(clusterItems, canonical, cfg, nonce) {
   if (!clusterItems?.length) return '';
   const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': canonical + '#cluster',
    'name': SiteDNA.get(cfg.WARUNG_DOMAIN).hdcClusterTitle || 'Topik Serupa',
    'url': canonical,
    'numberOfItems': clusterItems.length,
    'itemListOrder': 'https://schema.org/ItemListOrderDescending',
    'itemListElement': clusterItems.map((r, i) => ({
     '@type': 'ListItem',
     'position': i + 1,
     'url': r.url || '',
     'name': r.title || '',
    })),
   };
   return `<script type="application/ld+json" nonce="${nonce || generateNonce()}">${JSON.stringify(schema, null, 0)}</script>`;
  },

 /**
  * warmFromD1 — load doc vectors ke memory saat cold start.
  * FIX 3: Fast-path via KV snapshot (~5ms) sebelum D1 query (~50-200ms).
  * KV snapshot di-load sync, D1 full refresh jalan di background.
  *
  * @param {D1Database} db
  * @param {string} domain
  * @param {object} [kv] - CF KV binding (env.KV), opsional untuk fast path
  */
 async warmFromD1(db, domain, kv = null) {
  if (!db) return;
  // ── Fast path: KV snapshot (< 5ms) ──────────────────────────────────
  if (kv) {
   const loaded = await hdcSnapshotLoad(domain, kv);
   if (loaded >= 5) {
    // Snapshot valid — user pertama dapat rekomendasi segera.
    // D1 full refresh di background untuk update data fresh.
    SemanticIndex._warmFromD1Full(db, domain).catch(() => {});
    return; // early return — cukup dari snapshot
   }
  }
  // ── Slow path: D1 full query ─────────────────────────────────────────
  await SemanticIndex._warmFromD1Full(db, domain);
 },

 /**
  * _warmFromD1Full — implementasi asli warmFromD1, dipanggil sebagai fallback
  * atau background refresh setelah KV snapshot di-load.
  */
 async _warmFromD1Full(db, domain) {
  if (!db) return;
  try {
   const prefix = domain + ':';
   const now = Date.now();
   // OPT 30K: naik dari LIMIT 500 → 2000, konsisten dengan _hdcDocCache max size.
   // D1 free tier: 5M reads/hari. Single query 2000 rows ≈ 2000 reads. Budget aman.
   const rows = await db.prepare(
    'SELECT doc_key, vec_data, title, item_type, views FROM hdc_vectors ' +
    'WHERE doc_key >= ? AND doc_key < ? AND (expires_at = 0 OR expires_at > ?) LIMIT 2000'
   ).bind(prefix, prefix + '\xff', now).all();
   if (!rows?.results?.length) return;
   let loaded = 0;
   for (const row of rows.results) {
    if (_hdcDocCache.get(row.doc_key)) continue; // sudah ada di memory — skip
    try {
     const arr = JSON.parse(row.vec_data);
     if (!Array.isArray(arr) || arr.length !== _HDC_CHUNKS * 2) continue;
     const vec = new Uint32Array(arr);
     _hdcDocCache.set(row.doc_key, {
      vec,
      id: parseInt(row.doc_key.slice(prefix.length), 10), // FIX #D: Number, konsisten dengan API source
      title: row.title,
      url: null,
      type: row.item_type || 'video',
      thumb: null,
      views: row.views || 0,
     });
     loaded++;
    } catch { /* baris rusak — skip */ }
   }
   // Silent di production — tidak ada console.log
  } catch (e) {
   logError('SemanticIndex.warmFromD1', e);
  }
 },

 /**
  * persistToD1 — simpan doc vectors baru ke D1 sebagai secondary cache.
  * Dipanggil via bgTask (waitUntil) setelah index — tidak blocking request.
  * Hanya simpan entry yang belum ada di D1 (INSERT OR IGNORE) untuk efisiensi.
  *
  * @param {D1Database} db
  * @param {string} domain
  */
 async persistToD1(db, domain) {
  if (!db) return;
  try {
   const prefix = domain + ':';
   const expiresAt = Date.now() + TTL_7_DAY;
   const stmts = [];
   for (const [key, entry] of _hdcDocCache) {
    if (!key.startsWith(prefix)) continue;
    if (!entry.vec) continue;
    stmts.push(
     db.prepare(
      'INSERT OR IGNORE INTO hdc_vectors (doc_key, vec_data, title, item_type, views, expires_at) ' +
      'VALUES (?, ?, ?, ?, ?, ?)'
     ).bind(
      key,
      JSON.stringify(Array.from(entry.vec)),
      entry.title || '',
      entry.type || 'video',
      entry.views || 0,
      expiresAt
     )
    );
    // D1 batch max 100 statements
    if (stmts.length >= 100) {
     await db.batch(stmts.splice(0, 100));
    }
   }
   if (stmts.length > 0) await db.batch(stmts);
  } catch (e) {
   logError('SemanticIndex.persistToD1', e);
  }
 },
};
// ─────────────────────────────────────────────────────────────────────────────

const _alchemistCache = new LRUMap(10);

const _STOPWORDS = new Set([
 'dan','di','ke','dari','yang','untuk','pada','dengan','oleh','ini','itu',
 'ada','akan','bisa','dapat','harus','saja','sudah','belum','sebagai',
 'secara','karena','atau','tapi','namun','juga','lagi','sangat','sekali',
 'tanpa','antara','setelah','tentang','tersebut','merupakan','adalah',
 'ialah','yaitu','yakni','bahwa','sehingga','maka','demi','bagi','dalam',
 'kepada','para','the','and','for','with','from','this','that','are',
 'was','has','have','not','but','they','you','our','its',
]);

// ── Alchemist per-domain failure tracking constants ──────────────────────────
// Skip sister domain yang gagal berturut-turut — hemat fetch budget dan CPU.
// MAX_FAIL  : jumlah gagal berturut-turut sebelum domain masuk backoff
// BACKOFF_MS: durasi skip setelah mencapai MAX_FAIL (default 1 jam)
// State di-reset otomatis saat isolate cold start — tidak ada KV overhead.
const _ALCH_MAX_FAIL  = 3;
const _ALCH_BACKOFF_MS = 60 * 60 * 1000; // 1 jam

class Alchemist {
 constructor(cfg) {
 this.cfg = cfg;
 this.domain = cfg.WARUNG_DOMAIN;

 this.index = null; // kitab cacah tanah kekuasaan sendiri
 this.networkIndex= null; // kitab cacah gabungan semua sister domains
 this.ts = 0;
 this.networkTs = 0;
 this.TTL = 600000;
 this.NETWORK_TTL = 1800000; // jaringan seduluran gaib diudani ulang lebih jarang — 30 menit

 // Rajah Pamitran Aksara Sewu wayang kulit sing mlaku dewe — di-rebuild setiap kali kitab cacah berubah
 // ndandakake srana cost: O(Σ panjang semua tembung kunci pitu rupa) — amortisasi ke ribuan ngupadi ing pepeteng call
 this._ac = null; // AC untuk kitab cacah lokal
 this._networkAc = null; // AC untuk networkIndex — Angka iki luwih tuwo seko nenek moyangmu

 // Per-domain failure tracking — skip domain yang terus gagal sampai backoff habis
 // key: sister domain string, value: { failCount: number, nextRetry: number (epoch ms) }
 this._domainFailures = new Map();
 }

 // ── ndandakake srana Rajah Pamitran Aksara Sewu dari keys peta gaib kitab cacah ─────────────────────────────────
 // peta gaib keys adalah kata lowercase — langsung jadi wangsit kumpulan jimat
 _buildAc(indexMap) {
 if (!indexMap || indexMap.size === 0) return null;
 return new AhoCorasick(indexMap.keys());
 }

 static get(cfg) {
 let inst = _alchemistCache.get(cfg.WARUNG_DOMAIN);
 if (!inst) {
 inst = new Alchemist(cfg);
 _alchemistCache.set(cfg.WARUNG_DOMAIN, inst);
 }
 return inst;
 }

 // ── ndandakake srana kitab cacah dari list item — support prefix tanah kekuasaan untuk jaringan seduluran gaib mode ──
 _buildIndex(items, domainPrefix='') {
 const map = new Map();
 const seenSet = new Map(); // word → Set<url> — hanya hidup selama build, O(1) dedup
 for (const item of items) {
 if (!item?.title) continue;
 const url = domainPrefix
 ? 'https://' + domainPrefix + itemUrl(item, this.cfg)
 : itemUrl(item, this.cfg);

 const words = item.title
 .toLowerCase()
 .split(/[^\w\u00C0-\u024F]+/)
 .filter(w => w.length >= (this.cfg.ALCHEMIST_MIN_WORD_LEN || 3) && !_STOPWORDS.has(w));
 for (const word of words) {
 let arr = map.get(word);
 if (!arr) { arr = []; map.set(word, arr); seenSet.set(word, new Set()); }
 const seen = seenSet.get(word);
 if (!seen.has(url)) {
 seen.add(url);
 arr.push({ title: item.title, url, external: !!domainPrefix });
 }
 }
 }
 return map;
 }

 // ── nyawiji roh beberapa kitab cacah peta gaib jadi satu ────────────────────────────────────
 // Pakai Set per-word untuk dedup URL — O(1) lookup vs O(n) .some() sebelumnya
 _mergeIndexes(maps) {
 const merged = new Map();
 const seenUrls = new Map(); // word → Set<url> — dibuang setelah merge selesai
 for (const map of maps) {
 for (const [word, entries] of map) {
 let existing = merged.get(word);
 if (!existing) { existing = []; merged.set(word, existing); seenUrls.set(word, new Set()); }
 const seen = seenUrls.get(word);
 for (const e of entries) {
 if (!seen.has(e.url)) { seen.add(e.url); existing.push(e); }
 }
 }
 }
 return merged;
 }

 async refresh(client) {
 try {
 const [trendRes, recentRes] = await Promise.all([
 client.getTrending(30).catch(() => ({ data: [] })),
 client.getMediaList({ per_page: 30, sort: 'newest' }).catch(() => ({ data: [] })),
 ]);
 const seen = new Set();
 const items = [];
 for (const item of [...(trendRes?.data || []), ...(recentRes?.data || [])]) {
 if (item?.id && !seen.has(item.id)) { seen.add(item.id); items.push(item); }
 }
 this.index = this._buildIndex(items);
 this.ts = Date.now();
 this._ac = this._buildAc(this.index); // rebuild AC — O(Σ tembung kunci pitu rupa length)
 _alchemistCache.set(this.domain, this);
 } catch (err) {
 logError('Alchemist.refresh', err);
 }
 }

 // ── jaringan seduluran gaib Mode: njupuk srana adoh trending dari setiap sister tanah kekuasaan via Dapur lawang rahasia belakang ──
 async refreshNetwork(client) {
 const rawDomains = this.cfg.ALCHEMIST_NETWORK_DOMAINS || '';
 if (!rawDomains) return;
 const sisterDomains = rawDomains.split(',').map(d => d.trim()).filter(d => d && d !== this.domain);
 if (!sisterDomains.length) return;

 try {
 const now = Date.now();

 const networkMaps = await Promise.all(
 sisterDomains.map(async (sd) => {
 // ── Per-domain failure tracking: skip domain yang sedang dalam backoff ──
 const failInfo = this._domainFailures.get(sd);
 if (failInfo?.nextRetry && failInfo.nextRetry > now) return new Map(); // dalam backoff, skip

 let success = false;
 try {
 const dapurBase = (this.cfg._env?.DAPUR_BASE_URL || 'https://dapur.dukunseo.com').replace(/\/$/, '');
 const apiKey = this.cfg.DAPUR_API_KEY || '';
 // Turunkan timeout 8s → 5s: domain yang tidak respons dalam 5s kemungkinan bermasalah.
 // 8s terlalu longgar untuk background task yang harusnya cepat.
 const _ac = new AbortController();
 const _tid = setTimeout(() => _ac.abort(), 5000);
 let resp;
 try {
 resp = await fetch(`${dapurBase}/api/v1/trending?per_page=20`, {
 signal: _ac.signal,
 headers: {
 ...await _buildZeroFingerprintHeaders(this.cfg._env, sd, { isNavigation: false }),
 'X-API-Key': apiKey,
 'Origin': `https://${sd}`,
 },
 cf: { cacheTtl: 1800 },
 });
 } finally {
 clearTimeout(_tid);
 }
 if (!resp.ok) { return new Map(); } // success tetap false → increment failure
 let data;
 try { data = await resp.json(); } catch { return new Map(); }
 const items = data?.data || [];
 if (!items.length) return new Map(); // respons kosong bukan alasan backoff
 success = true;
 return this._buildIndex(items, sd);
 } catch {
 return new Map();
 } finally {
 // ── Update failure counter setelah setiap attempt ─────────────────
 if (success) {
  this._domainFailures.delete(sd); // reset — domain sehat kembali
 } else {
  const prev = this._domainFailures.get(sd);
  const failCount = (prev?.failCount || 0) + 1;
  // Baru masuk backoff setelah _ALCH_MAX_FAIL kali gagal berturut-turut
  const nextRetry = failCount >= _ALCH_MAX_FAIL ? now + _ALCH_BACKOFF_MS : 0;
  this._domainFailures.set(sd, { failCount, nextRetry });
 }
 }
 })
 );

 // nyawiji roh: kitab cacah sendiri + semua sister domains
 const allMaps = [this.index || new Map(), ...networkMaps.filter(m => m.size > 0)];
 this.networkIndex = this._mergeIndexes(allMaps);
 this.networkTs = Date.now();
 this._networkAc = this._buildAc(this.networkIndex); // rebuild jaringan seduluran gaib AC
 _alchemistCache.set(this.domain, this);
 } catch (err) {
 logError('Alchemist.refreshNetwork', err);
 }
 }

 async ensureIndex(client, waitUntilFn) {
 const age = Date.now() - this.ts;
 if (this.index && age < this.TTL) {
 // kitab cacah lokal isih anyar kaya embun esuk — cek juga jaringan seduluran gaib kitab cacah
 const networkAge = Date.now() - this.networkTs;
 const hasNetwork = !!(this.cfg.ALCHEMIST_NETWORK_DOMAINS);
 if (hasNetwork && (!this.networkIndex || networkAge >= this.NETWORK_TTL) && waitUntilFn) {
 waitUntilFn(this.refreshNetwork(client).catch(() => {}));
 }
 return;
 }
 if (this.index && age >= this.TTL && waitUntilFn) {
 waitUntilFn(this.refresh(client).catch(() => {}));
 return;
 }
 await this.refresh(client);
 // Langsung diudani ulang jaringan seduluran gaib juga kalau pertama kali
 if (this.cfg.ALCHEMIST_NETWORK_DOMAINS && waitUntilFn) {
 waitUntilFn(this.refreshNetwork(client).catch(() => {}));
 }
 }

 // ── Hasilkan tambang jangkar jiwa text variatif dari judul — bukan hanya full title ─────
 _anchorVariants(title, word, seed) {
 // Ambil potongan judul yang mengandung kata kunci (max 5 kata)
 const words = title.split(/\s+/);
 const idx = words.findIndex(w => w.toLowerCase().includes(word));
 const start = Math.max(0, idx - 1);
 const snippet = words.slice(start, start + 5).join(' ');
 const variants = [
 title, // full title — Iki cahya, iki pepeteng, iki loro-lorone
 snippet || title, // snippet 5 kata — Srengenge wedi karo kode iki
 ucfirst(word), // kata kunci saja — Saben baris iki ngandhut jiwa siji
 'Nonton ' + ucfirst(word), // prefix nonton — Titi mongso wis cedhak
 ucfirst(word) + ' terbaru', // suffix terbaru — Gusti ngerti kabeh, kode iki yo ngerti
 'Video ' + ucfirst(word), // prefix video — Ojo mbalekke opo sing wis diutus
 ];
 return variants[seed % variants.length];
 }

 // ── Hitung skor relevansi — pakai precomputed cacah gunggung dari AC (O(kedip mripat)) ──────────
 _scoreCandidate(word, entries, precomputedCount, domain, seed) {
 // Frekuensi langsung dari AC ngupadi ing pepeteng asil srana — tidak perlu rajah pencocokan aksara ulang
 const freqScore = Math.min(precomputedCount, 5); // cap 5 — Iki sangkan paraning dumadi

 // Bonus: judul lebih pendek → tambang jangkar jiwa lebih natural
 const entry = entries[seed % entries.length];
 const lenScore = entry ? Math.max(0, 5 - Math.floor(entry.title.length / 20)) : 0;

 return freqScore + lenScore;
 }

 generateInternalLinks(text, currentItemId, maxLinks, domain) {
 // Gunakan networkIndex kalau ada (gabungan semua sister tanah kekuasaan)
 // jalur kabur menyang latar wingit ke kitab cacah lokal
 const activeIndex = this.networkIndex || this.index;
 if (!activeIndex || !text) return '';
 maxLinks = maxLinks || 3;
 const _alchDna = SiteDNA.get(domain || this.domain);

 // ── AC single-pass scan — O(dawa umur) bukan O(kutukan berlipat) ───────────────────────────
 // Pilih wayang kulit sing mlaku dewe yang sesuai dengan activeIndex
 const activeAc = this.networkIndex ? this._networkAc : this._ac;

 const lowerText = text.toLowerCase();

 // panemu gaib: peta gaib<tembung kunci pitu rupa, frekuensi> — semua tembung kunci pitu rupa yang muncul di teks
 // Satu call ini menggantikan mubeng tanpa pungkasan "for each tembung kunci pitu rupa: new RegExp(k).test(text)"
 const matchCounts = activeAc
 ? activeAc.search(lowerText)
 : _acFallbackSearch(activeIndex, lowerText); // graceful degrade jika AC belum ndandakake srana

 if (matchCounts.size === 0) return '';

 // ── biji penilaian dukun — hanya untuk tembung kunci pitu rupa yang panemu gaib (jauh lebih sedikit dari kabeh gunggung kitab cacah) ─
 const candidates = [];
 const usedUrls = new Set();

 for (const [word, count] of matchCounts) {
 const entries = activeIndex.get(word);
 if (!entries?.length) continue;

 const seed = hashSeed(domain + ':' + word);
 const entry = entries[seed % entries.length];
 if (!entry?.url) continue;

 // Jangan link ke halaman yang sedang dibuka
 if (!entry.external && (
 entry.url.includes('/' + currentItemId + '/') ||
 entry.url.endsWith('/' + currentItemId)
 )) continue;

 if (usedUrls.has(entry.url)) continue;
 usedUrls.add(entry.url);

 // _scoreCandidate sekarang O(kedip mripat) — cacah gunggung sudah dihitung AC
 const score = this._scoreCandidate(word, entries, count, domain, seed)
 - (entry.external ? 1 : 0); // slight penalty cross-tanah kekuasaan
 candidates.push({ word, entry, score, seed });
 }

 if (!candidates.length) return '';

 candidates.sort((a, b) => b.score - a.score);
 const topPool = candidates.slice(0, Math.min(candidates.length, maxLinks * 3));
 const _hourSlot = Math.floor(Date.now() / 3_600_000); // berputar setiap 1 jam
 const shuffled = seededShuffle(topPool, hashSeed(domain + ':' + currentItemId + ':' + _hourSlot));
 const chosen = [];
 const chosenUrls = new Set(); // FIX: Set terpisah — usedUrls sudah penuh dari loop build candidates
 for (const c of shuffled) {
 if (chosen.length >= maxLinks) break;
 if (chosenUrls.has(c.entry.url)) continue;
 chosenUrls.add(c.entry.url);
 chosen.push(c);
 }

 if (!chosen.length) return '';

 const links = chosen.map(c => {
 const anchorSeed = hashSeed(domain + ':anchor:' + c.word + ':' + currentItemId);
 const anchorText = this._anchorVariants(c.entry.title, c.word, anchorSeed);
 // Cross-tanah kekuasaan link: tambah rel="noopener" + target="_blank"
 const extAttrs = c.entry.external
 ? ` target="_blank" rel="noopener noreferrer" data-network="1"`
 : '';
 return `<a href="${h(c.entry.url)}" class="alchemist-link" title="${h(c.entry.title)}"${extAttrs}>${h(anchorText)}</a>`;
 }).join(' &middot; ');

 const networkBadge = this.networkIndex
 ? `<span style="font-size:.75rem;opacity:.5;margin-left:6px">· network</span>`
 : '';

 return `<div class="alchemist-related">`
 + `<strong><i class="fas fa-link" aria-hidden="true"></i> ${_alchDna.alchemistLabel}${networkBadge}</strong> ${links}`
 + `</div>`;
 }
}

// ── FIX 3: Scheduled handler — HDC KV Snapshot setiap 30 menit ───────────────
// Tambahkan ke wrangler.toml:
//   [[triggers]]
//   crons = ["*/30 * * * *"]
//
// Atau jika sudah ada scheduled handler lain, merge blok di bawah ke dalamnya.
async function _scheduled(event, env, ctx) {
 const cfg = getConfig(env);

 // HDC Snapshot — serialize top-100 item populer ke KV
 // Budget: 48 KV writes/hari per domain. Limit free tier: 1000/hari. ✓
 if (env.KV && cfg.HDC_ENABLED !== false && cfg.WARUNG_DOMAIN) {
  ctx.waitUntil(
   hdcSnapshotSave(cfg.WARUNG_DOMAIN, env.KV)
    .catch(err => console.error('[Cron:hdcSnapshot]', err?.message))
  );
 }

 // Scheduled ping IndexingHammer — existing behavior dipertahankan
 if (cfg.WARUNG_DOMAIN) {
  try {
   const hammer = IndexingHammer.get(env, cfg);
   ctx.waitUntil(
    hammer.scheduledPing(ctx.waitUntil.bind(ctx))
     .catch(err => console.error('[Cron:scheduledPing]', err?.message))
   );
  } catch { /* IndexingHammer tidak tersedia — skip */ }
 }
}
// ── END FIX 3 scheduled ───────────────────────────────────────────────────────

export default {
 fetch: _fetch,
 scheduled: _scheduled,
};
