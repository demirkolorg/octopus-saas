# **Octopus – Haber Kazıma (SaaS) Teknik Ürün Gereksinim Dokümanı (v1.1)**

**Tarih:** 29.11.2025 **Sürüm:** 1.1 (Nihai V1 Kapsamı) **Durum:** Onaylandı

---

## **1\. Özet (TL;DR)**

Octopus, bireysel kullanıcıların ve araştırmacıların, kendi belirledikleri haber kaynaklarından otomatik olarak içerik toplamalarını sağlayan bir SaaS (Hizmet Olarak Yazılım) platformudur. Kullanıcılar, kod yazmaya gerek kalmadan görsel bir arayüz (Proxy tabanlı önizleme) üzerinden haber sitelerini tanımlar, başlık ve içerik alanlarını seçer. Sistem, "çek ve sakla" mantığıyla çalışır, resimleri hotlink yapar ve eski verileri otomatik temizler.

**V1 Odak Noktası:** Kişisel kullanım için basit, güvenilir, "kur ve unut" mantığında çalışan, tam kontrollü bir haber toplama aracı sunmak.

---

## **2\. Hedefler (Goals)**

### **2.1 İş Hedefleri (Business Goals)**

* İlk 3 ay içerisinde ücretsiz sürümde **100 aktif kullanıcıya** ulaşmak.  
* 6 ay içinde ilk ücretli abonelik paketini pazara sunmak.  
* Müşteri destek taleplerinin **%90’ını ilk 48 saat içinde** çözüme kavuşturmak.  
* Ürün geliştirme aşamasında bulut altyapı maliyetlerini aylık **250 USD** altında tutmak.

### **2.2 Kullanıcı Hedefleri (User Goals)**

* **Hızlı Kurulum:** Kullanıcının siteyi görsel olarak görüp, elementleri tıklayarak seçmesi (ID, Class, XPath desteği).  
* **Otomasyon:** Arka planda periyodik tarama ve ilk kurulumda geçmiş verinin çekilmesi.  
* **Temiz İçerik:** Reklamlardan arındırılmış, sadece başlık ve metin odaklı okuma.  
* **Sadelik:** Haber bağlantılarını, başlık ve özetini kullanımı rahat bir arayüzle görebilmek.

### **2.3 Kapsam Dışı (Non-Goals \- V1)**

* Proxy Havuzu / IP Rotasyonu (V2 hedefi).  
* Paywall (Ödeme duvarı) aşma veya login gerektiren siteler.  
* Haberin sonradan güncellenmesi (Snapshot/Anlık görüntü mantığı geçerlidir).  
* Otomatik içerik analiz ve kategorizasyon (Yapay zeka özeti vb. V1’de yok).

---

## **3\. Teknik Strateji ve Mimari Kararlar**

### **3.1 Görsel Seçici Mekanizması (HTML Proxy & Renderer)**

Kullanıcının tarayıcısında "Gömülü Tarayıcı" hissi yaratmak ve CORS/X-Frame-Options sorunlarını aşmak için:

* **Proxy Servisi:** Kullanıcı URL girdiğinde, Backend (Node.js) sayfayı indirir.  
* **Rewriting (Yeniden Yazma):** İndirilen HTML'deki tüm `src` ve `href` linkleri, Octopus API üzerinden geçecek şekilde yeniden yazılır. `<base>` etiketi manipüle edilir.  
* **Frontend Render:** İşlenmiş HTML, Frontend'de izole bir kapsayıcıda (veya güvenli iframe içinde) gösterilir.

### **3.2 Seçici (Selector) Stratejisi: "En Sağlamı Bul"**

Sadece tek bir yönteme güvenmek yerine "Cascade" (Şelale) yöntemi kullanılır. Seçici kaydedilirken şu öncelik sırasıyla analiz edilir:

1. **ID:** Elementin benzersiz ID'si varsa önceliklidir.  
2. **Unique Class:** Sayfada benzersiz veya belirgin bir Class ismi varsa.  
3. **XPath:** Yukarıdakiler yoksa, elementin DOM ağacındaki tam yolu kullanılır. *Crawler çalışırken elementi bulmak için bu sırayı takip eder.*

### **3.3 İçerik ve Veri Politikası**

* **Resimler:** Sunucuya indirilmez (Hosting maliyeti sıfırlanır). Kaynak URL veritabanına kaydedilir ve Frontend'de doğrudan gösterilir (Hotlinking).  
* **Sanitizasyon:** Çekilen HTML içeriği "agresif" bir temizlikten geçer. Sadece `<p>, <b>, <i>, <img>, <h2>` gibi temel etiketlere izin verilir. Script, iframe ve stil dosyaları silinir.  
* **Veri Saklama (Retention):** Veritabanı şişkinliğini önlemek için 30 günden eski haberleri silen otomatik bir "Cleanup Job" çalışır.

---

## **4\. Fonksiyonel Gereksinimler**

### **4.1 Kaynak Yönetimi**

* **Geçmişe Dönük Tarama (Backfill):** Kaynak ilk kez eklendiğinde, sistem otomatik olarak mevcut sayfadaki tüm haberleri (örn. son 20-50 adet) çeker. Bu, sistemin çalıştığını kullanıcıya hemen kanıtlar.  
* **Hata Yönetimi (Anti-Scraping):** Eğer kaynak site Octopus sunucusunu engellerse (403/429 hataları), kullanıcıya "Bu kaynak şu an desteklenmiyor" hatası gösterilir. (V1 için proxy yatırımı yapılmaz).

### **4.2 Kazıma Kuralları**

* **Görsel Element Seçimi:** Siteyi açıp, fare ile manşet veya içerik bloklarının seçilmesi.  
* **Hata Kontrolleri:** Bozuk ya da değişmiş sayfa yapısında kullanıcıya bildirim.

### **4.3 İçerik Görüntüleme**

* **Kısmi İçerik (Partial Content):** Detay sayfasındaki içerik çekilemezse (yapı bozuksa), sistem hata vermek yerine sadece başlığı ve varsa özeti kaydeder. Kullanıcı "Detaya Git" diyerek orijinal siteye yönlendirilir.  
* **Değişmezlik:** Haber bir kez çekildikten sonra, kaynak sitede başlık değişse bile sistemde güncellenmez.

---

## **5\. Veri Modeli ve Şema**

### **`sources` (Kaynaklar Tablosu)**

* `id` (PK), `user_id` (FK)  
* `name`, `url`  
* `status` (active | paused | error)

`selectors` (JSONB):  
JSON  
{  
  "list\_item": { "type": "css", "val": ".card-news" },  
  "title": { "type": "xpath", "val": "//h1\[@class='news-head'\]" },  
  "content": { "type": "css", "val": "article.body" },  
  "image": { "type": "css", "val": "img.featured" },  
  "strategy": "hybrid"  
}

*   
* `refresh_interval_seconds` (Varsayılan: 900 sn)  
* `last_crawl_at`

### **`articles` (Haberler Tablosu)**

* `id` (PK), `source_id` (FK)  
* `title` (Text)  
* `content` (Text/HTML \- Temizlenmiş)  
* `image_url` (Text \- Harici Link)  
* `original_url` (Text)  
* `is_read` (Boolean, Varsayılan: False)  
* `is_partial` (Boolean \- İçerik çekilemediyse True)  
* `hash` (Benzersizlik kontrolü için özet)  
* `created_at` (Sistem kayıt tarihi \- 30 gün sonra silinir)

---

## **6\. İş Akışı (Crawler Workflow)**

1. **Tetikleme:** Zamanlayıcı (Cron) veya Kullanıcı isteği ("Şimdi Tara").  
2. **Erişim & Kontrol:**  
   * Hedef siteye istek atılır.  
   * Başarılı ise devam edilir.  
   * Engellendiyse (403/429) görev başarısız sayılır. 3\. tekrar eden hatada kaynak otomatik durdurulur.  
3. **Liste Ayrıştırma:**  
   * `selector` stratejisine göre haber kartları ve detay linkleri bulunur.  
4. **Detay & Sanitizasyon:**  
   * Detay sayfasına gidilir.  
   * Başlık ve İçerik alınır \-\> HTML Sanitizer çalıştırılır.  
   * Resim URL'i alınır.  
5. **Kaydetme:**  
   * Daha önce bu URL kaydedilmiş mi? (Hash kontrolü).  
   * Hayırsa \-\> `articles` tablosuna eklenir.  
6. **Temizlik:**  
   * Her gece çalışan Cron Job: `created_at` tarihi 30 günden eski olan kayıtları siler.

---

## **7\. Kullanıcı Deneyimi (UX) Özeti**

* **Adım 1:** Kullanıcı "Yeni Kaynak Ekle" butonuna basar ve URL girer.  
* **Adım 2:** Octopus, URL'i kendi güvenli göstericisinde açar.  
* **Adım 3:** Kullanıcı bir haber başlığına tıklar. Sistem diğer başlıkları da otomatik seçer.  
* **Adım 4:** Kullanıcı detay sayfasına geçer, metin ve tarih alanını seçer. "Kaydet" der.  
* **Adım 5:** Sistem geçmişe dönük son 20 haberi hemen çeker ve listeler.  
* **Adım 6:** Kullanıcı panelde haberleri okur, "Okundu" olarak işaretler.

---

## **8\. Fazlandırma ve Yol Haritası**

**Toplam Tahmini Süre:** 4-5 Hafta

1. **Hafta 1: Altyapı & Proxy Servisi**  
   * DB Kurulumu, Backend HTML Fetcher & Rewriter (Görsel seçici için).  
2. **Hafta 2: Seçici Sihirbazı (Frontend)**  
   * Iframe içinde Proxy edilmiş sayfanın gösterimi ve element tıklama mantığı.  
3. **Hafta 3: Crawler & Scheduler**  
   * Playwright entegrasyonu, Sanitizasyon modülü, Backfill mantığı.  
4. **Hafta 4: UI & Temizlik**  
   * Haber okuma listesi, Veri silme job'ı, Test ve Bugfix.

