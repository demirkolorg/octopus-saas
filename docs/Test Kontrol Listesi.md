# **QA (Kalite Kontrol) ve Sürüm Kontrol Listesi**

Bu liste, Octopus'un yeni bir sürümünü yayına almadan önce manuel olarak kontrol edilmesi gereken kritik senaryoları içerir.

## **1\. Kimlik Doğrulama (Authentication)**

* \[ \] **E-posta Kayıt:** Kullanıcı e-posta ve şifre ile başarılı bir şekilde kayıt olabiliyor mu?  
* \[ \] **Google Giriş:** "Google ile Giriş Yap" butonu çalışıyor ve OAuth akışı tamamlanıyor mu?  
* \[ \] **Hata Mesajları:** Yanlış şifre veya kayıtlı olmayan e-posta girildiğinde anlamlı bir hata mesajı dönüyor mu?  
* \[ \] **Rota Koruması:** Giriş yapmamış bir kullanıcı `/dashboard` sayfasına gitmeye çalıştığında `/login` sayfasına yönlendiriliyor mu?

## **2\. Görsel Seçici (Çekirdek Özellik)**

* \[ \] **Iframe Yükleme:** Geçerli bir haber sitesi URL'si girildiğinde, önizleme penceresi (Iframe) ve Proxy düzgün çalışıyor mu?  
* \[ \] **Element Seçimi:** Haber başlığına tıklandığında, sistem doğru CSS seçicisini (Selector) otomatik üretiyor mu?  
* \[ \] **Alan Tanımlama:** Başlık, İçerik ve Tarih alanları ayrı ayrı seçilip atanabiliyor mu?  
* \[ \] **Canlı Test:** "Test Et" butonuna basıldığında, o anki veriler (Başlık ve Link) doğru şekilde önizleniyor mu?

## **3\. Tarama Motoru (Crawler Engine)**

* \[ \] **Manuel Tetikleme:** Kaynak kartındaki "Şimdi Tara" butonu yeni bir iş (Job) başlatıyor mu?  
* \[ \] **Durum Güncellemesi:** İş durumu arayüzde anlık değişiyor mu? (Bekliyor \-\> Çalışıyor \-\> Tamamlandı).  
* \[ \] **Veri Akışı:** Tarama bittiğinde yeni makaleler listeye düşüyor mu?  
* \[ \] **Tekilleştirme:** Aynı kaynak tekrar tarandığında, veritabanına aynı haberler ikinci kez eklenmiyor mu? (Hash kontrolü).

## **4\. Panel ve Okuma Deneyimi**

* \[ \] **Listeleme:** Haber listesi sayfalandırma (pagination) veya "Daha Fazla Yükle" ile düzgün çalışıyor mu?  
* \[ \] **Okundu İşaretleme:** Bir habere "Okundu" dendiğinde listeden siliniyor veya soluklaşıyor mu?  
* \[ \] **Görseller:** Haber görselleri (Hotlink) kırık link olmadan yükleniyor mu?  
* \[ \] **Filtreleme:** Sol menüden bir kaynak seçildiğinde, sadece o kaynağa ait haberler mi listeleniyor?

## **5\. Sistem Dayanıklılığı (Resilience)**

* \[ \] **Hatalı URL:** Kaynak eklerken bozuk veya olmayan bir URL girilirse sistem çökmeden uyarı veriyor mu?  
* \[ \] **Bağlantı Kopması:** İnternet bağlantısı kesildiğinde arayüz kullanıcıya "Çevrimdışı" uyarısı veya genel bir hata mesajı gösteriyor mu?

