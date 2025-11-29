# **🐙 Octopus – Master Todo List**

## **🗓️ Faz 1: Altyapı, Veritabanı ve Proxy Servisi (Hafta 1\)**

**Hedef:** Sistemin temellerini atmak ve Görsel Seçici için gereken HTML manipülasyon servisini hazırlamak.

### **🛠 Backend & Altyapı**

* \[ \] **Proje Kurulumu:** Node.js (NestJS/Express) repo'sunun oluşturulması ve Docker yapılandırması.  
* \[ \] **Veritabanı Kurulumu:** PostgreSQL instance'ının ayağa kaldırılması.  
* \[ \] **Veri Modeli (Migration):** PRD'deki şemaya uygun `users`, `sources`, `articles` ve `crawl_jobs` tablolarının oluşturulması.  
* \[ \] **Auth Entegrasyonu:** JWT veya NextAuth ile temel kayıt ol (Sign up) ve giriş yap (Login) endpoint'leri.  
* \[ \] **Redis Kurulumu:** Kuyruk (Queue) yapısı için Redis'in kurulması.

### **🔌 Proxy & HTML Fetcher (Kritik)**

* \[ \] **Fetcher Servisi:** Verilen URL'nin HTML'ini sunucu tarafında indiren (Axios/Fetch) fonksiyonun yazılması.  
* \[ \] **HTML Rewriter:** İndirilen HTML içindeki göreceli linkleri (`/haber/1` \-\> `https://site.com/haber/1`) mutlak linke çeviren modül.  
* \[ \] **Proxy Endpoint:** Frontend'in çağıracağı, düzenlenmiş HTML'i dönen `GET /api/proxy?url=...` endpoint'inin yazılması.  
* \[ \] **CORS/Security:** Proxy yanıtlarında Frontend'in iframe içinde çalışmasına izin verecek header ayarları.

---

## **🗓️ Faz 2: Frontend & Görsel Seçici Sihirbazı (Hafta 2\)**

**Hedef:** Kullanıcının kod yazmadan element seçebileceği arayüzü tamamlamak.

### **🖥 Frontend (Next.js)**

* \[ \] **Proje Kurulumu:** Next.js \+ Tailwind CSS kurulumu ve tema ayarları.  
* \[ \] **Dashboard Layout:** Sidebar (Kaynaklar) ve Main Area (Haber Akışı) iskeletinin kodlanması.  
* \[ \] **Kaynak Ekleme Modalı:** URL giriş input'u ve doğrulama.

### **🪄 Görsel Seçici (Visual Selector)**

* \[ \] **Iframe Entegrasyonu:** Proxy'den gelen HTML'in güvenli bir iframe veya Shadow DOM içinde gösterilmesi.  
* \[ \] **Highlight Logic:** Fare ile üzerine gelinen HTML elementinin etrafına çerçeve (border) çizen script.  
* \[ \] **Click & Capture:** Tıklanan elementin `tagName`, `class` ve `id` bilgilerini yakalayan event listener.  
* \[ \] **Selector Generator:**  
  * \[ \] ID varsa ID'yi al.  
  * \[ \] Unique Class varsa Class'ı al.  
  * \[ \] Hiçbiri yoksa XPath üreten algoritmayı yaz.  
* \[ \] **Wizard Steps:** Adım 1 (Liste Seçimi) \-\> Adım 2 (Detay Başlık/İçerik Seçimi) akışının UI'da yönetilmesi.  
* \[ \] **Önizleme (Test):** Seçilen kurallara göre o an ekrandaki veriyi (başlık, link) "Test Et" butonuyla kullanıcıya gösterme.

---

## **🗓️ Faz 3: Crawler Motoru ve İş Kuyruğu (Hafta 3\)**

**Hedef:** Arka planda haberleri toplayan, temizleyen ve kaydeden motoru yazmak.

### **🕷 Crawler Engine (Backend)**

* \[ \] **Playwright Entegrasyonu:** Headless browser servisinin kurulması.  
* \[ \] **Navigation Logic:** Kaydedilen `list_page_url`'e gidip `list_item_selector` ile döngü kurma mantığı.  
* \[ \] **Detail Page Parser:**  
  * \[ \] Detay linkine git.  
  * \[ \] Başlık, Tarih, Resim (URL al) çek.  
  * \[ \] İçerik (Content) çek.  
* \[ \] **Sanitizer Modülü:** Çekilen HTML içeriğini temizleyen (Script, Style, Iframe silen) fonksiyon (örn: `dompurify` veya `sanitize-html`).  
* \[ \] **Partial Content Handling:** Eğer içerik çekilemezse `is_partial = true` olarak sadece başlığı kaydetme mantığı.  
* \[ \] **Hashing & Deduplication:** `source_id + url` bazlı hash üretip mükerrer kaydı engelleme.

### **⏱ Queue & Scheduler**

* \[ \] **Queue Setup:** BullMQ ile `crawlQueue` oluşturulması.  
* \[ \] **Cron Job:** Her 15 dakikada bir aktif kaynakları bulup kuyruğa ekleyen zamanlayıcı.  
* \[ \] **Rate Limiting:** Aynı domain için ardışık istekler arasına 3 saniye bekleme süresi (Delay) ekleme.  
* \[ \] **Backfill Trigger:** Yeni kaynak eklendiğinde "Anında Tara" tetikleyicisinin çalıştırılması.

---

## **🗓️ Faz 4: UI, İçerik Yönetimi ve Temizlik (Hafta 4\)**

**Hedef:** Kullanıcının haberleri okuyabileceği ve sistemin kendi kendini temizleyeceği yapıyı kurmak.

### **📱 Kullanıcı Arayüzü (UI)**

* \[ \] **Haber Kartları:** Başlık, Özet, Resim (Hotlink), Kaynak İkonu ve Tarih içeren kart tasarımı.  
* \[ \] **Okundu/Okunmadı:** Haberi "Okundu" işaretleme butonu ve API entegrasyonu.  
* \[ \] **Filtreleme:** Sadece belirli bir kaynağın haberlerini gösterme özelliği.  
* \[ \] **Manual Trigger:** Kaynak kartında "Şimdi Tara" butonu ve loading durumu.  
* \[ \] **Hata Gösterimi:** Eğer kaynak `status=error` ise kullanıcıya uyarı rozeti gösterme.

### **🧹 Bakım ve Temizlik**

* \[ \] **Retention Job:** Günde bir kez çalışıp `created_at < 30 gün` olan makaleleri veritabanından silen Cron Job.  
* \[ \] **Error Threshold:** Üst üste 3 kez hata veren kaynağın statüsünü `paused` yapan mantık.

---

## **🗓️ Faz 5: Test, Deployment ve Launch (Hafta 5\)**

**Hedef:** Ürünü canlıya almak.

### **🧪 Test**

* \[ \] **Selector Testleri:** Farklı yapıdaki 5-10 popüler haber sitesi (WordPress, Özel Yazılım vb.) ile selector sihirbazının test edilmesi.  
* \[ \] **Yük Testi:** Aynı anda 10 tarama görevi çalışırken sunucu RAM/CPU durumunun izlenmesi.  
* \[ \] **Edge Cases:** 404 veren sayfalar, resimsiz haberler, çok uzun başlıklar vb. senaryoların testi.

### **🚀 Deployment**

* \[ \] **Environment Variables:** `.env` dosyasının Production için ayarlanması.  
* \[ \] **Docker Compose:** Backend, Frontend, Redis ve Postgres'in production modunda kaldırılması.  
* \[ \] **SSL/Domain:** Domain yönlendirmesi ve HTTPS sertifikası.  
* \[ \] **Monitoring:** Basit bir log izleme (PM2 logs veya Docker logs) kurulumu.

---

**Bir Sonraki Adım:** Hangi bölümden başlamak istersin?

1. **Backend:** "Önce veritabanı tablolarını (SQL) oluşturup Node.js projesini kuralım."  
2. **Frontend:** "Önce Görsel Seçici (Visual Selector) prototipini yapalım, en riskli kısım orası."

