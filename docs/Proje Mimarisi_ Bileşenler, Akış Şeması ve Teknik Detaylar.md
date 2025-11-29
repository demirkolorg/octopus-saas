### **🏛️ Mimari Şema (Kuş Bakışı)**

Önce bu yapı sunucuda (VPS) nasıl duracak, ona bakalım:

Kod snippet'i  
\[ KULLANICI (Tarayıcı) \]  
       │  
       ▼  
\[ FRONTEND (Next.js) \] \<--- (Kullanıcı Arayüzü)  
       │  
       │ (HTTP İstekleri: /api/sources, /api/login)  
       ▼  
\[ BACKEND (NestJS API) \]  
       │  
       ├──► \[ Veritabanı (PostgreSQL) \] (Kalıcı Veri: Kullanıcılar, Haberler)  
       │  
       ├──► \[ Kuyruk (Redis) \] (Hafıza & İş Listesi)  
       │  
       ▼  
\[ WORKER (NestJS \+ Playwright) \] \<--- (Arka Plandaki "Robot")  
       │  
       ▼  
\[ İNTERNET (Haber Siteleri) \]

---

### **🎬 Sahne 1: "Sihir Anı" (Görsel Seçici / Visual Selector)**

Kullanıcının bir siteyi eklediği o "büyülü" an. Burası projenin en teknik kısmı.

1. **İstek (Frontend):** Kullanıcı `haberler.com` adresini kutuya yazar. Next.js, Backend'e "Bana bu sitenin güvenli halini ver" der (`GET /api/proxy?url=...`).  
2. **Hazırlık (Backend \- Cheerio):** NestJS, siteye gider, HTML kodunu indirir.  
   * *Temizlik:* Zararlı scriptleri siler.  
   * *Link Değişimi:* Resim ve CSS linklerini, bizim sunucumuz üzerinden geçecek şekilde yeniden yazar (Proxy).  
   * *Yanıt:* Temizlenmiş HTML string'ini Frontend'e geri döner.  
3. **Gösterim (Frontend \- Iframe):** Next.js, gelen bu HTML'i güvenli bir `<iframe>` içinde gösterir. Site sanki canlıymış gibi görünür ama kontrol bizdedir.  
4. **Seçim (JS Logic):** Kullanıcı bir başlığa tıkladığında, Frontend'deki JavaScript hesap yapar: "Bu tıkladığın şey `div.news-card` içindeki `h3` etiketidir."  
5. **Kayıt:** Kullanıcı "Kaydet" dediğinde, bu hesaplanan CSS/XPath formülü Backend'e gönderilir ve **PostgreSQL**'e yazılır.

---

### **🎬 Sahne 2: "Motorun Çalışması" (Crawler & Queue)**

Kullanıcı uyurken arka planda olanlar. Burası sistemin kalbi.

1. **Zil Çalar (BullMQ Scheduler):** Redis'teki saat, "Kaynak ID: 5'in taranma zamanı geldi" der.  
2. **İş Atama (Redis):** Bu görev kuyruğa (Queue) eklenir.  
3. **Robot Uyanır (Playwright Worker):** NestJS içindeki Worker, kuyruktan işi kapar.  
4. **Gizlilik (Stealth):** Playwright, `puppeteer-extra-plugin-stealth` ile maskesini takar ("Ben robot değilim, normal Chrome'um").  
5. **Operasyon:**  
   * Siteye gider.  
   * Veritabanındaki formülü (Selector) kullanır.  
   * Başlıkları ve resim linklerini toplar.  
6. **Kontrol (Hash Check):** Robot, bulduğu haberin başlığından bir parmak izi (Hash) oluşturur. "Bu parmak izi veritabanında var mı?" diye sorar. Varsa kaydetmez (Mükerrer önleme).  
7. **Teslimat:** Yeni haberler **PostgreSQL**'e yazılır.

---

### **🎬 Sahne 3: "Servis" (Okuma Deneyimi)**

Kullanıcı sabah kahvesini alıp sisteme girdiğinde.

1. **Sorgu (React Query):** Kullanıcı paneli açtığında Frontend, "Bana okunmamış haberleri ver" der.  
2. **Veri Çekme (Prisma):** NestJS API, PostgreSQL'e `SELECT * FROM articles WHERE is_read = false` sorgusunu atar.  
3. **Sunum (UI):** Gelen JSON verisi, **shadcn/ui** kart bileşenlerine dönüşür.  
   * *Resimler:* Resimler bizim sunucumuzda değil, kaynak siteden (Hotlink) yüklenir.  
   * *Hız:* Next.js bu sayfayı çok hızlı render eder.

---

### **🛠 Destek Ekipleri (Yan Roller)**

Bu ana aktörlerin yanında hayat kurtaran yardımcılar vardır:

* **Coolify (Yönetmen):** Kodunuzu GitHub'a attığınızda (Push), Coolify bunu görür. "Yeni senaryo geldi" der; eski Docker konteynerlerini kapatır, yenilerini derler ve ayağa kaldırır. Kesinti olmaz.  
* **GlitchTip (Güvenlik Kamerası):** Eğer Playwright bir sitede hata verirse veya API çökerse, anında GlitchTip paneline "Hata var\!" diye bildirim düşer.  
* **Resend (Postacı):** Kullanıcı şifresini unuttuysa, NestJS Resend'e emir verir ve e-posta kullanıcının kutusuna düşer.

### **Özet: Neden Bu Parçalar?**

* **NestJS \+ BullMQ:** Asenkron işleri (tarama) kullanıcıyı bekletmeden yapmak için şart.  
* **Next.js \+ Proxy:** CORS hatası almadan siteyi görsel olarak seçtirmek için şart.  
* **Postgres \+ Prisma:** İlişkisel veriyi (Hangi haber hangi kaynağın, hangi kaynak hangi kullanıcının) hatasız tutmak için şart.

