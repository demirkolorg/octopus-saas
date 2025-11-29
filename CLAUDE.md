# **Octopus Proje Bağlamı ve Kuralları**

## **1\. Proje Genel Bakışı**

Octopus, kişisel haber kazıma (scraping) odaklı bir SaaS platformudur.

* **Temel Değer:** Kullanıcılar, hedef web sitelerindeki alanları (başlık, içerik vb.) proxy tabanlı görsel bir seçici (iframe) üzerinden tanımlar. Sistem bu tanımlara göre periyodik olarak tarama yapar.  
* **Hedef Kitle:** Bireysel son kullanıcılar (B2C).  
* **Mimari:** Monorepo-benzeri yapı (Backend ve Frontend aynı Git deposunda ancak ayrı klasörlerde).

## **2\. Teknoloji Yığını (V1.2)**

### **Backend (Sunucu Tarafı)**

* **Framework:** NestJS (Modüler mimari).  
* **Dil:** TypeScript (Katı/Strict mod).  
* **Veritabanı:** PostgreSQL 16 (**Prisma ORM** aracılığıyla).  
* **Kuyruk (Queue):** Redis \+ **BullMQ** (Tarama işleri için).  
* **Kimlik Doğrulama:** Passport-JWT (Stateless/Durumsuz).  
* **Doğrulama:** `class-validator` \+ `class-transformer`.  
* **E-posta:** Resend.  
* **Loglama:** GlitchTip (veya Sentry) \+ NestJS Logger.

### **Frontend (İstemci Tarafı)**

* **Framework:** Next.js 14/15 (App Router).  
* **Stil:** Tailwind CSS \+ **shadcn/ui** (Lucide İkonları).  
* **Durum Yönetimi (State):** Sunucu durumu için **TanStack Query (React Query)**.  
* **Formlar:** React Hook Form \+ **Zod**.  
* **Analitik:** PostHog.

### **Crawler (Tarama Motoru)**

* **Tarayıcı:** Playwright (Headless Chromium).  
* **Gizlilik (Stealth):** `puppeteer-extra-plugin-stealth` (Bot korumalarını aşmak için).  
* **Ayrıştırıcı:** Cheerio (Hafif HTML proxy işlemleri için).

### **Altyapı**

* **Deployment:** Docker \+ Coolify (VPS üzerinde).  
* **CI/CD:** GitHub Actions (İleri aşamada).

## **3\. Mimari ve Temel Desenler**

### **Görsel Seçici (Proxy Deseni)**

1. **Frontend:** `GET /api/proxy?url=HEDEF_SITE` isteği atar.  
2. **Backend:** HTML'i Cheerio/Axios ile indirir (Kaynak tasarrufu için burada Playwright kullanılmaz).  
3. **Backend:** Göreceli linkleri (`src="/img.png"`) mutlak linklere veya proxy URL'lerine çevirir (Rewriting).  
4. **Frontend:** İşlenmiş HTML'i izole bir `iframe` içinde gösterir.  
5. **Kullanıcı:** Bir elemente tıklar \-\> Frontend CSS seçicisini hesaplar \-\> API'ye gönderir.

### **Tarayıcı (Worker Deseni)**

1. **Zamanlayıcı (Scheduler):** İşi BullMQ `crawlQueue` kuyruğuna ekler.  
2. **Worker:** NestJS Processor işi kuyruktan alır.  
3. **Playwright:** Sayfayı açar \-\> Kayıtlı seçicileri uygular \-\> Veriyi çeker.  
4. **Tekilleştirme:** `(sourceId + articleUrl)` kombinasyonunun SHA256 özetini (hash) oluşturur. Veritabanında varsa kaydetmeden geçer.

## **4\. Kodlama Standartları**

### **Genel**

* **Asenkron:** Her zaman `async/await` kullanın. `.then()` zincirlerinden kaçının.  
* **Tipler:** Public API'ler ve DTO'lar için `interface` kullanın. `any` tipinden kesinlikle kaçının.  
* **Ortam Değişkenleri:** Sadece `process.env` üzerinden erişin. Anahtarlar eksikse uygulama başlatılırken hata verip durmalıdır (Fail fast).

### **Backend (NestJS)**

* **Controller/Service Ayrımı:** Controller'ları zayıf (thin) tutun (sadece yönlendirme ve doğrulama). İş mantığı mutlaka Servislerde (Services) olmalıdır.  
* **DTO:** Her API uç noktası (endpoint), `class-validator` dekoratörleri içeren bir DTO kullanmalıdır.  
* **Hata Yönetimi:** Global Exception Filter kullanın. Servislerin içinde `HttpException` (örneğin `NotFoundException`) fırlatın.  
* **Veritabanı:** Ham SQL (Raw SQL) yazmayın. Prisma Client metodlarını kullanın.

### **Frontend (Next.js)**

* **Server vs Client:** Varsayılan olarak Server Components kullanın. `'use client'` ifadesini sadece interaktif parçalarda (formlar, hook'lar) kullanın.  
* **Veri Çekme:** GET istekleri için `useQuery`, POST/PUT/DELETE işlemleri için `useMutation` kullanın.  
* **Bileşenler:** `@/components/ui` altındaki `shadcn/ui` bileşenlerini kullanın. Temel bileşenleri (Button, Input) yeniden icat etmeyin.

## **5\. Test Stratejisi (Katı)**

* **Kural:** Her yeni Özellik Modülü (Feature Module), "Mutlu Yol"u (Happy Path) kapsayan en az bir `.spec.ts` dosyasına sahip olmalıdır.  
* **Backend:** Jest ile birim testleri (Unit tests). Veritabanı çağrılarında gerçek DB yerine `prisma-mock` kullanın.  
* **Frontend:** React Testing Library ile bileşen testleri (Kullanıcı etkileşimine odaklanın, uygulama detaylarına değil).

## **6\. Proje Yapısı**

Plaintext  
/  
├── backend/  
│   ├── src/  
│   │   ├── modules/          \# Özellik modülleri (Auth, Crawler, Sources vb.)  
│   │   ├── common/           \# Guard'lar, Interceptor'lar, Decorator'lar  
│   │   ├── prisma/           \# Şema ve Migrasyonlar  
│   │   └── main.ts  
│   └── test/  
├── frontend/  
│   ├── src/  
│   │   ├── app/              \# App Router Sayfaları  
│   │   ├── components/       \# UI (shadcn) ve özelliğe özgü bileşenler  
│   │   ├── hooks/            \# Özel React hook'ları  
│   │   └── lib/              \# Araçlar, API istemcisi (axios instance)  
└── docker-compose.yml        \# Geliştirme altyapısı (Postgres, Redis)

## **7\. Sık Kullanılan Komutlar**

### Docker Servisleri
```bash
npm run docker:up      # PostgreSQL + Redis başlat
npm run docker:down    # Servisleri durdur
npm run docker:logs    # Logları izle
```

### Geliştirme
```bash
npm run dev:all        # Backend + Frontend aynı anda
npm run dev:backend    # Sadece Backend (port 3001)
npm run dev:frontend   # Sadece Frontend (port 3000)
```

### Veritabanı Migration (KRİTİK!)

**Windows Docker Desktop ile PostgreSQL arasında SCRAM-SHA-256 kimlik doğrulama sorunu var.**
Migration'ları doğrudan `npx prisma migrate dev` ile çalıştıramazsın!

**Docker network içinden çalıştır:**
```bash
docker run --rm --network octopus-saas_default -v "D:/projects/octopus-saas/backend:/app" -w //app -e DATABASE_URL="postgresql://octopus:secret123@postgres:5432/octopus_db" node:20 npx prisma@5 migrate dev --name <migration_name>
```

**Prisma Client generate:**
```bash
docker run --rm --network octopus-saas_default -v "D:/projects/octopus-saas/backend:/app" -w //app -e DATABASE_URL="postgresql://octopus:secret123@postgres:5432/octopus_db" node:20 npx prisma@5 generate
```

### Veritabanı Bağlantı Bilgileri
| Parametre | Değer |
|-----------|-------|
| Host (Docker içinden) | `postgres` |
| Host (Windows'tan) | Çalışmıyor (SCRAM sorunu) |
| Port | `5432` |
| User | `octopus` |
| Password | `secret123` |
| Database | `octopus_db` |

### Diğer Komutlar
* **Lint:** `npm run lint:all` (Backend + Frontend lint)

