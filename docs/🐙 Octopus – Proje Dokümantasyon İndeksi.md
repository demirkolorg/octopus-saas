# **🐙 Octopus – Proje Dokümantasyon İndeksi**

Bu dosya, Octopus projesi için hazırlanan teknik, idari ve tasarımsal dökümanların haritasıdır. Dosyalar, kullanım amaçlarına ve proje yaşam döngüsündeki sıralarına göre kategorize edilmiştir.

---

## **1\. Temel Vizyon ve Planlama**

*Projenin ne olduğunu, neyi hedeflediğini ve kapsamını anlatan stratejik belgeler.*

* 📄 **Ürün Pazarlama Metni ve Fayda Özeti:** Potansiyel müşterilere projenin değerini anlatan, teknik olmayan tanıtım metni. Landing page ve e-postalar için kaynak.  
* 📄 **Teknik Ürün Gereksinim Dokümanı (PRD):** Projenin anayasası. Hedefler, kullanıcı hikayeleri, yapılacaklar ve yapılmayacaklar (kapsam) burada tanımlıdır.  
* 📄 **Proje Yol Haritası ve Master Görev Listesi:** Geliştirme sürecinin (Faz 1, Faz 2...) zaman çizelgesi ve adım adım yapılacak işlerin listesi (Todo List).

## **2\. Mimari ve Teknik Altyapı**

*Sistemin nasıl çalışacağını ve hangi teknolojilerin kullanılacağını belirleyen teknik belgeler.*

* 📄 **Proje Mimarisi: Bileşenler, Akış Şeması ve Teknik Detaylar:** Sistemin kuş bakışı görünümü. Frontend, Backend, Crawler ve Veritabanı arasındaki veri akışını anlatır.  
* 📄 **Nihai Teknoloji Yığını ve Sistem Entegrasyonu:** Kullanılan araçların (NestJS, Next.js, Playwright, Coolify vb.) listesi ve neden seçildikleri.

## **3\. Geliştirme Rehberleri (AI ve Kodlama İçin)**

*Kod yazarken sürekli başvurulacak, özellikle AI asistanına (Claude Code) bağlam sağlayan kritik belgeler.*

* 📄 **AI Bağlam ve Kurallar (`CLAUDE.md`):** **(En Kritik Dosya)** Yapay zeka asistanına projenin kodlama standartlarını, dosya yapısını ve kurallarını öğreten dosya. Kodlamaya başlarken AI'ya ilk verilecek döküman.  
* 📄 **Veritabanı Şeması (`schema.prisma`):** PostgreSQL veritabanındaki tabloların (User, Source, Article) ve ilişkilerin kod karşılığı.  
* 📄 **API Sözleşmesi:** Frontend ve Backend'in nasıl konuşacağını belirleyen uç nokta (endpoint) tanımları ve JSON formatları.  
* 📄 **.env.example:** Projenin çalışması için gereken gizli anahtarların (API Key, DB URL) şablon listesi.

## **4\. Tasarım ve Arayüz**

*Kullanıcı deneyimi ve görsel tutarlılık belgeleri.*

* 📄 **Tasarım Rehberi:** Renk paleti, tipografi, buton stilleri ve UI kuralları. Arayüz geliştirirken başvurulacak kaynak.

## **5\. Yayın Öncesi ve Yasal**

*Projeyi canlıya almadan önce yapılacak son kontroller.*

* 📄 **Test Kontrol Listesi (QA Checklist):** Canlıya çıkmadan önce "Login çalışıyor mu?", "Crawler veri çekiyor mu?" gibi manuel kontrollerin listesi.  
* 📄 **Yasal Taslaklar:** Kullanım Koşulları ve Gizlilik Politikası metinleri.

