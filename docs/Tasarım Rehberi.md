# **Octopus Tasarım Sistemi**

## **1\. Renk Paleti (Mavi & Arduvaz Odağı)**

Tailwind CSS'in varsayılan `blue` ve `slate` renk skalalarını kullanıyoruz. Bu kombinasyon, okuma odaklı bir uygulama için ciddiyet ve sakinlik sağlar.

* **Birincil (Primary):** `blue-600` (\#2563EB)  
  * *Kullanım:* Ana butonlar (CTA), aktif durumlar, linkler ve vurgular.  
  * *Hover Durumu:* `blue-700`.  
* **İkincil (Secondary):** `slate-800` (\#1E293B)  
  * *Kullanım:* Kenar çubuğu (Sidebar), ana başlıklar, güçlü vurgular.  
* **Arka Plan (Background):** `slate-50` (\#F8FAFC)  
  * *Kullanım:* Tüm uygulamanın ana zemin rengi. Gözü yormayan kırık beyaz.  
* **Yüzeyler (Surface):** `white` (\#FFFFFF)  
  * *Kullanım:* Kartlar (Cards), modallar, dropdown menüler.  
* **Yıkıcı/Hata (Destructive):** `red-500` (\#EF4444)  
  * *Kullanım:* Silme butonları, hata mesajları, kritik uyarılar.  
* **Sessiz Metin (Muted):** `slate-500`  
  * *Kullanım:* Tarihler, alt açıklamalar, ikincil bilgiler.

## **2\. Tipografi**

Okunabilirlik en önemli önceliğimizdir. `next/font/google` modülü kullanılacaktır.

* **Yazı Tipi Ailesi:** `Inter` (Sans-serif).  
  * *Alternatif:* Kod blokları ve CSS seçicileri için `JetBrains Mono` veya `Fira Code`.  
* **Hiyerarşi:**  
  * **H1 (Sayfa Başlıkları):** `text-2xl font-bold text-slate-900`  
  * **H2 (Kart Başlıkları):** `text-lg font-semibold text-slate-800`  
  * **H3 (Haber Başlıkları):** `text-base font-medium text-slate-900 leading-snug`  
  * **Gövde (Body):** `text-sm text-slate-600 leading-relaxed`  
  * **Küçük (Small):** `text-xs text-slate-500`

## **3\. Bileşenler (shadcn/ui Ayarları)**

`shadcn/ui` kütüphanesi aşağıdaki temel ayarlarla başlatılmalıdır:

* **Style:** `New York`  
* **Base Color:** `Slate`  
* **Radius (Köşe Yuvarlaklığı):** `0.5rem` (`rounded-md`). Modern ama çok yumuşak olmayan bir görünüm.  
* **Gölgeler (Shadows):**  
  * Kartlar: `shadow-sm` (Hafif derinlik).  
  * Dropdown/Hover: `shadow-md`.  
* **Butonlar:**  
  * **Primary:** Solid Blue (`bg-blue-600 text-white hover:bg-blue-700`).  
  * **Outline:** Kenarlıklı (`border border-slate-200 hover:bg-slate-100`).  
  * **Ghost:** Arka plansız (`hover:bg-slate-100 text-slate-600`). Genellikle "Okundu İşaretle" gibi ikincil eylemler için.

## **4\. İletişim Dili (Tone of Voice)**

Kullanıcı arayüzündeki metinler profesyonel, kısa ve işlevsel olmalıdır.

* **Tarz:** Robotik değil ama aşırı samimi de değil. Net ve yardımcı.  
* **Etiketler (Labels):** Eylem odaklı.  
  * *Doğru:* "Kaynağı Ekle", "Şimdi Tara", "Ayarlar"  
  * *Yanlış:* "Hadi Başlayalım", "Taramayı Başlatıver"  
* **Mesajlar:** Başarı veya hatayı net belirtin.  
  * *Doğru:* "Kaynak başarıyla eklendi." / "Bağlantı hatası: Siteye erişilemiyor."  
  * *Yanlış:* "Yaşasın\! Başardın\!" / "Ups, bir şeyler ters gitti."

