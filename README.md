# Life Manager

Türkçe, çevrimdışı çalışabilen kişisel yaşam yönetimi PWA'sı. Kayıtlar Dexie ve IndexedDB ile cihazda saklanır; hesap veya sunucu gerekmez.

## Kurulum ve geliştirme

Node.js 20.19+ veya 22.12+ gerekir.

```bash
npm install
npm run dev
```

Kontroller ve dağıtım derlemesi:

```bash
npm run typecheck
npm test
npm run lint
npm run build
npm run preview
```

## PWA kurulumu

Uygulamayı HTTPS üzerinden yayımlayın (veya yerelde çalıştırın). Android Chrome'da menüden **Uygulamayı yükle / Ana ekrana ekle** seçilebilir. iPhone/iPad Safari'de paylaş menüsünü açıp **Ana Ekrana Ekle** seçin. Çevrimdışı uygulama kabuğu servis çalışanı tarafından önbelleğe alınır; kişisel kayıtlar servis çalışanı önbelleğine konmaz, IndexedDB'de kalır. PWA arka plan çalışması, özellikle iOS'ta sınırlıdır.

## Android uygulaması

Android uygulaması Capacitor ile aynı React arayüzünü paketler. Android Studio/SDK Platform 36, Android Build Tools 36 ve JDK 21 gerekir. APK oluşturmak ve Android Studio'da açmak için:

```bash
npm run android:debug
npm run android:open
```

Debug APK: `android/app/build/outputs/apk/debug/app-debug.apk`. Telefona USB ile yüklemek için Android geliştirici seçeneklerinde USB hata ayıklamayı açıp `adb install -r android/app/build/outputs/apk/debug/app-debug.apk` çalıştırın; alternatif olarak dosyayı telefona kopyalayıp açın ve bilinmeyen uygulama yükleme izni verin. Bu debug APK imzası yalnızca kişisel test/yükleme içindir. Yayın sürümü için kendi keystore'unuzla imzalama yapılandırın; keystore ve parolaları depoya eklemeyin.

Veriler Dexie/IndexedDB'de kalır; Android'e geçişte veritabanı şeması değişmez. Web sitesi ve Android uygulaması farklı tarayıcı origin'lerinde çalıştığı için web sürümündeki mevcut kayıtlar Android'e otomatik kopyalanmaz. Taşımak için web sürümünde JSON yedeği oluşturup Android uygulamasından içe aktarın. Uygulama güncellemeleri cihazdaki veriyi korur, ancak uygulamayı kaldırmak Android uygulama verilerini siler. Android yedeklemesi kapalıdır; veriyi cihazdan çıkarmak için Ayarlar'daki JSON yedeğini kullanın. Android'de JSON ve CSV dışa aktarımları sistem paylaşım menüsünü açar. İçe aktarma Android'in dosya seçicisini kullanır. APK uygulama içeriğini yerel olarak taşır ve normal kullanım için ağ bağlantısı gerekmez.

## Yedekleme

Ayarlar'dan sürümlü JSON yedeği indirip daha sonra birleştirme ya da yerini alma onayıyla içe aktarabilirsiniz. Finans CSV'si TRY miktarlarını kuruş cinsinden dışa aktarır. Yedek dosyalarını güvenli bir yerde saklayın; tarayıcı/site verilerinin silinmesi yerel verileri silebilir.

### Google Drive (henüz yapılandırılmadı)

Uygulamada sahte Drive bağlantısı yoktur. Gerçek entegrasyon için Google Cloud Console'da proje ve OAuth 2.0 Web application istemcisi oluşturulmalı; yayımlanan origin ve redirect URI'leri tanımlanmalı; Drive API açılmalı; gerekiyorsa OAuth consent screen doğrulanıp yayınlanmalıdır. Ön yüz `VITE_GOOGLE_CLIENT_ID` gibi herkese açık istemci kimliğini kullanabilir; **client secret ön yüze konmamalıdır**. Uygulamanın oluşturduğu/eriştiği dosyalar için en dar uygun kapsam (`drive.file`) değerlendirilmelidir. Bu yapılandırma ve kullanıcı kimlik bilgileri olmadan Drive yedekleme/geri yükleme kullanılamaz.

Drive API kotaları, Google hesabı depolama kotası ve OAuth consent-screen/test kullanıcı kısıtları geçerlidir. PWA arka plan yürütmesi güvenilir olmadığından otomatik yedek veya çok cihazlı eşitleme vaat edilmez; manuel yedekleme tercih edilir.

## Gizlilik ve sınırlamalar

- Normal kullanım tamamen yereldir; hesap, reklam, ücretli servis veya yapay kayıt sınırı yoktur.
- Tarayıcı depolamasının kapasitesi ve tarayıcı politikaları pratik sınırdır.
- JSON içe aktarma dosya biçimi ve temel kayıt alanlarını kontrol eder; kritik verilerde içe aktarmadan önce ayrıca yedek alın.
- JSON yedeğinde parola tabanlı şifreleme ve gerçek Google Drive OAuth entegrasyonu henüz yoktur.
- Alışkanlıklarda günlük işaretleme vardır; ayrıntılı streak hesapları ve tamamlanma geçmişi istatistikleri henüz tamamlanmamıştır.

## Teknoloji

React, TypeScript, Vite, Dexie/IndexedDB, date-fns, Lucide, Recharts ve vite-plugin-pwa.
