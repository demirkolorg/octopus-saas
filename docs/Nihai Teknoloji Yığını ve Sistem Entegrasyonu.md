# **🏗️ Octopus – Nihai Teknoloji Yığını (Tech Stack v1.2)**

Bu liste, geliştirme hızı, maliyet verimliliği ve ölçeklenebilirlik dengesi gözetilerek **2 kişilik ekip** için optimize edilmiştir.

### **1\. Backend & API (Core)**

* **Runtime:** Node.js (v20+ LTS)  
* **Framework:** **NestJS** (Modüler mimari için)  
* **Dil:** TypeScript  
* **Veritabanı ORM:** **Prisma** (Hızlı geliştirme ve Type safety için)  
* **Validasyon:** `class-validator` & `class-transformer` (Gelen veri güvenliği)  
* **Kuyruk (Queue):** **BullMQ** (Redis tabanlı iş yönetimi)  
* **Auth:** Passport-JWT (Stateless kimlik doğrulama)

### **2\. Frontend (Client)**

* **Framework:** **Next.js 14/15** (App Router)  
* **Dil:** TypeScript  
* **UI Kit:** **shadcn/ui** \+ **Tailwind CSS** \+ **Lucide Icons**  
* **State & Fetching:** **TanStack Query (React Query)** (Sunucu durumu yönetimi)  
* **Formlar:** **React Hook Form** \+ **Zod** (Şema bazlı form doğrulama)

### **3\. Crawler (The Engine)**

* **Browser:** **Playwright** (Headless Chromium)  
* **Stealth:** `playwright-extra` \+ `puppeteer-extra-plugin-stealth` (Bot korumalarını aşmak için)  
* **Parser:** **Cheerio** (Hafif HTML manipülasyonu ve Proxy servisi için)

### **4\. Altyapı & Veri (Infrastructure)**

* **Sunucu:** **VPS** (Hetzner Cloud \- CPX21 veya üstü)  
* **Yönetim:** **Coolify** (Self-hosted PaaS \- Heroku alternatifi)  
* **Veritabanı:** PostgreSQL (v16)  
* **Cache:** Redis (Kuyruk ve önbellek için)  
* **Konteyner:** Docker

### **5\. Araçlar ve Servisler (Tooling)**

* **E-posta:** **Resend** (Transactional mailler için)  
* **İzleme (Monitoring):** **GlitchTip** (Sentry alternatifi, Coolify üzerinden self-hosted)  
* **Analitik:** **PostHog** (Kullanıcı davranış takibi, Cloud Free Tier veya Self-hosted)

---

### **🧩 Büyük Resim: Parçalar Nasıl Birleşiyor?**

1. **Geliştirici (Siz),** VS Code'da TypeScript ile kod yazar.  
2. Kodu **GitHub**'a pushlar.  
3. **Coolify (VPS üzerinde),** değişikliği algılar.  
4. **NestJS Backend** ve **Next.js Frontend** Docker container'ları olarak yeniden derlenir ve yayına alınır.  
5. Kullanıcı arayüzden "Kaynak Ekle" dediğinde:  
   * **Next.js**, **NestJS API**'ye istek atar.  
   * **NestJS**, **Cheerio** ile siteyi indirip manipüle eder ve kullanıcıya gösterir.  
   * Kullanıcı kaydettiğinde, **Prisma** veritabanına yazar.  
   * **BullMQ**, Redis'e "Bu siteyi şimdi tara" diye bir iş (job) atar.  
6. **Playwright Worker** (NestJS içinde ayrı bir process), kuyruktaki işi alır, siteye gider, veriyi çeker ve **Prisma** ile kaydeder.  
7. )

---

## **📂 Önerilen Proje Yapısı (Monorepo-Lite)**

İki ayrı repo ile uğraşmak yerine, tek bir Git reposu içinde Backend ve Frontend'i ayırmak (Turborepo gibi araçlara girmeden, basitçe klasör bazlı) yönetimi çok kolaylaştırır.

Plaintext  
octopus-saas/  
├── .git/  
├── README.md  
├── docker-compose.yml       \# Local geliştirme için DB ve Redis ayağa kaldırır  
├── .env                     \# Ortak değişkenler (Opsiyonel)  
│  
├── backend/                 \# NestJS Projesi  
│   ├── src/  
│   │   ├── modules/  
│   │   │   ├── auth/  
│   │   │   ├── crawler/     \# Playwright mantığı burada  
│   │   │   ├── sources/  
│   │   │   └── proxy/       \# HTML Fetcher servisi  
│   │   ├── prisma/          \# DB Şeması  
│   │   └── main.ts  
│   ├── package.json  
│   ├── Dockerfile           \# Backend deployment için  
│   └── ...  
│  
└── frontend/                \# Next.js Projesi  
    ├── src/  
    │   ├── app/             \# Sayfalar (Dashboard, Login vs.)  
    │   ├── components/      \# shadcn/ui bileşenleri  
    │   ├── lib/             \# API istemcisi (axios/fetch wrapper)  
    │   └── hooks/           \# useSource, useArticles (React Query)  
    ├── package.json  
    ├── Dockerfile           \# Frontend deployment için  
    └── ...

---

## **🚀 Başlangıç Komutları (Kick-off)**

Eğer hazırsanız, projeyi kurmak için şu adımları izleyebilirsiniz:

**1\. Ana Klasörü Oluşturun:**

Bash  
mkdir octopus-saas && cd octopus-saas  
git init

**2\. Backend'i Kurun (NestJS):**

Bash  
npm i \-g @nestjs/cli  
nest new backend  
\# Paket yöneticisi olarak 'npm' veya 'pnpm' seçin

**3\. Frontend'i Kurun (Next.js):**

Bash  
npx create-next-app@latest frontend  
\# TypeScript: Yes, Tailwind: Yes, App Router: Yes, Src Directory: Yes

**4\. UI Kütüphanesini Ekleyin (Frontend içine):**

Bash  
cd frontend  
npx shadcn@latest init  
\# Style: New York, Base Color: Slate  
