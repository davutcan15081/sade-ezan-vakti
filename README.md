# Ezan Vakti - Otomatik Alarm Sistemi

Ezan vakitlerini gösteren ve otomatik alarm kurabilen mobil uygulama.

## 📱 Özellikler

- ✅ Namaz vakitlerini otomatik olarak gösterir
- ✅ Konum bazlı ezan vakitleri hesaplaması
- ✅ Otomatik alarm sistemi (Android)
- ✅ Bildirim ile hatırlatma
- ✅ Modern ve kullanıcı dostu arayüz
- ✅ Ayarlanabilir alarm süreleri

## 🚀 Kurulum

### Gereksinimler

- Node.js 18+
- npm veya yarn
- Android Studio (Android geliştirme için)

### Adımlar

1. Repository'yi klonlayın:
```bash
git clone https://github.com/davutcan15081/sade-ezan-vakti.git
cd sade-ezan-vakti
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. Uygulamayı build edin:
```bash
npm run build
```

4. Android'i sync edin:
```bash
npx cap sync android
```

5. Uygulamayı çalıştırın:
```bash
npx cap run android
```

## 📱 Test

Uygulamada "🔥 Test Alarmı" butonuna basarak otomatik alarm sistemini test edebilirsiniz.

## 🛠️ Teknolojiler

- **Frontend:** React + TypeScript + Vite
- **Mobile:** Capacitor
- **Native:** Android (Java)
- **Styling:** CSS + Tailwind CSS
- **Icons:** Lucide React

## 📱 Android Özellikleri

- **AlarmManager:** Doğrudan sistem alarmı
- **WakeLock:** Cihazı uyandırma
- **KeyguardManager:** Ekran kilidini açma
- **Full Screen Intent:** Otomatik uygulama açma
- **Notifications:** Bildirim sistemi

## 🔧 Ayarlar

Uygulama aşağıdaki ayarları sunar:

- Konum (GPS veya manuel)
- Alarm sesleri
- Bildirimler
- Ezan vakitleri için hatırlatma süreleri

## 📝 Notlar

- Uygulama Diyanet'ten ezan vakitlerini çeker
- Konum izni gerektirir
- Android pil optimizasyonları devre dışı bırakılmalıdır

## 🤝 Katkı

Katkıda bulunmak isterseniz:

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Commit yapın (`git commit -m 'Add some AmazingFeature'`)
4. Push yapın (`git push origin feature/AmazingFeature`)
5. Pull Request açın

## 📄 Lisans

Bu proje MIT lisansı altındadır.

## 📞 İletişim

- GitHub: [@davutcan15081](https://github.com/davutcan15081)

---

⭐ Eğer bu projeyi beğendiyseniz lütfen yıldız vermeyi unutmayın!
