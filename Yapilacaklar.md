# Yapılacaklar / Yol Haritası — TİT 🦂 Akrep İndirici

Bu dosya, uygulamayı daha verimli, güvenli ve kullanışlı hale getirecek; ileride
eklenebilecek özellikleri toplar. Maddeler öncelik sırasına göre gruplanmıştır.
İşaretlemeler: `[ ]` yapılacak, `[~]` üzerinde çalışılıyor, `[x]` tamamlandı.

---

## ✅ Tamamlananlar (mevcut sürüm v10.9.0)
- [x] X (Twitter) / TikTok / Instagram indirme sekmeleri
- [x] Gerçek indirme motoru (cobalt API, çoklu sunucu yedeği, ayarlanabilir adres)
- [x] Kaliteli seçim (X için 1080/720/480/360), TikTok/Instagram için otomatik en yüksek kalite
- [x] Filigran / kullanıcı adı temizliği (TikTok & Instagram)
- [x] Panodan otomatik link yapıştırma
- [x] Parmak izi / yüz tanıma kilidi + yedek PIN
- [x] Gizlilik koruması (ekran görüntüsü engeli + arka planda bulanıklaştırma)
- [x] 5 tema (Siyah İnci, Gece Mavisi, Zümrüt, Yakut, Nebi Özkan Özel) + AMOLED/Beyaz mod
- [x] Gömülü video oynatıcı
- [x] Platform başına indirilenler ızgarası (geçmiş)
- [x] Buton/tab/tema animasyonları + haptik geri bildirim
- [x] GitHub Actions ile otomatik kurulabilir APK derlemesi

---

## 🔥 Yüksek Öncelik (kullanıcı deneyimini en çok iyileştirecek)
- [ ] **İndirme kuyruğu / aynı anda çoklu indirme** — birden fazla linki sıraya alma, ilerleme takibi
- [ ] **Galeriye kaydet seçeneği** — isteğe bağlı olarak telefon galerisine de aktarma (`expo-media-library`)
- [ ] **Arka planda indirme** — uygulama kapalıyken bile indirmeye devam (background task / bildirim)
- [ ] **İndirme bildirimi** — tamamlandığında sistem bildirimi (`expo-notifications`)
- [ ] **Paylaş menüsü entegrasyonu** — başka uygulamadan "Paylaş > TİT" ile linki doğrudan alma (Android Share Intent)
- [ ] **Otomatik link algılama** — uygulama açılınca panoda link varsa "İndir?" diye sorma
- [ ] **Hata mesajlarını iyileştirme** — sunucu çökerse otomatik yedek sunucuya geçişi kullanıcıya açıklama

## 🎨 Arayüz / Kişiselleştirme
- [ ] **Kendi arka planını yükle** — kullanıcının galeriden tema arka planı seçmesi
- [ ] **Daha fazla tema** + tema önizleme ekranı
- [ ] **Ana ekran widget'ı** — hızlı indirme kısayolu
- [ ] **Dil seçeneği** (TR/EN) — çok dilli destek (i18n)
- [ ] **Yazı tipi boyutu / erişilebilirlik** ayarları

## 🔐 Güvenlik & Gizlilik
- [ ] **Gizli klasör / kasa** — belirli videoları ekstra şifreyle gizleme
- [ ] **Otomatik kilitlenme süresi** — X dakika sonra otomatik kilit
- [ ] **Sahte şifre (decoy)** — yanlış PIN girilince boş kasa gösterme
- [ ] **Yedekleme & geri yükleme** — indirilenleri şifreli olarak dışa/içe aktarma

## ⚙️ İndirme Motoru
- [ ] **Ses olarak indir (MP3)** — sadece sesi çıkarma seçeneği
- [ ] **Galeri/çoklu medya (carousel)** — Instagram çoklu gönderi desteği
- [ ] **Story / Highlights indirme** (giriş gerektirenler için yönlendirme)
- [ ] **Küçük resim/önizleme** — indirmeden önce video önizlemesi gösterme
- [ ] **Kendi cobalt sunucusunu kurma rehberi** — uygulama içi yardım sayfası
- [ ] **YouTube Shorts / Facebook / Reddit** gibi ek platform desteği

## 🧪 Kalite & Altyapı
- [ ] **Birim/uçtan uca testler** (indirme akışı, tema, kilit) — Jest + Detox
- [ ] **EAS Build profili** — mağaza için imzalı AAB/APK üretimi
- [ ] **Google Play / App Store yayını** — kendi imza anahtarı ile
- [ ] **Çökme raporlama** (Sentry) ve temel anal- (gizliliğe saygılı)
- [ ] **Otomatik güncelleme** (EAS Update / OTA) — yeniden kurmadan güncelleme
- [ ] **İndirme geçmişi arama / filtreleme**

## 💡 Fikirler (uzun vade)
- [ ] **Akıllı pano dinleyici** — kopyalanan linki algılayıp bildirim çubuğundan tek dokunuşla indirme
- [ ] **Toplu indirme** — bir kullanıcının son N videosunu indirme (izin dahilinde)
- [ ] **Video düzenleme** — kırpma, en boy oranı değiştirme
- [ ] **Watermark ekleme (kendi markan)** — isteğe bağlı kişisel filigran

---

> Not: İçerik indirme özellikleri ilgili platformların kullanım koşullarına ve
> telif haklarına tabidir. Yalnızca hakkına sahip olduğunuz veya izinli içerikleri
> indirin.
