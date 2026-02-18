
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { DEFAULT_SETTINGS, DEFAULT_COORDS } from './constants';
import { AppSettings, PrayerData, PrayerName, NextPrayerInfo, PrayerKeys, ManualLocation } from './types';
import { fetchPrayerTimes, calculateNextPrayer, getTimeDifferenceMinutes } from './services/prayerService.ts';
import DirectAlarm, { DirectAlarmWeb } from './services/directAlarm';
import AlarmOverlay from './components/AlarmOverlay';
import SettingsModal from './components/SettingsModal';
import LocationModal from './components/LocationModal';
import appLogo from './assets/icon.png';

// ============================================================
// BİLDİRİM KANALI (Doğrudan ekran açan alarm)
// ============================================================
const setupNotificationChannel = async () => {
  try {
    await LocalNotifications.createChannel({
      id: 'ezan_alarm_direct',
      name: 'Ezan Alarmı (Doğrudan)',
      description: 'Namaz vakti geldiğinde uygulamayı doğrudan açar',
      importance: 5, // MAX
      visibility: 1, // PUBLIC
      vibration: true,
      sound: '',
      lights: true
    });
  } catch (e) {
    console.warn("Bildirim kanalı oluşturulamadı:", e);
  }
};

// ============================================================
// UYGULAMAYI DOĞRUDAN AÇAN ALARM TETİKLEYİCİSİ
// ============================================================
const triggerAlarmDirectly = async (prayerKey: string) => {
  try {
    // Uygulama kapalıysa uygulamayı aç ve alarm ekranını göster
    if (Capacitor.isNativePlatform()) {
      // Native platformda doğrudan alarm ekranını göster
      const keyToName: Record<string, string> = {
        imsak: 'İmsak', gunes: 'Güneş', ogle: 'Öğle',
        ikindi: 'İkindi', aksam: 'Akşam', yatsi: 'Yatsı'
      };
      const prayerName = keyToName[prayerKey] || prayerKey;
      
      // Alarm state'ini doğrudan güncelle
      const event = new CustomEvent('showAlarm', { detail: { prayer: prayerName } });
      window.dispatchEvent(event);
    } else {
      // Web ortamında doğrudan alarm ekranını göster
      const keyToName: Record<string, string> = {
        imsak: 'İmsak', gunes: 'Güneş', ogle: 'Öğle',
        ikindi: 'İkindi', aksam: 'Akşam', yatsi: 'Yatsı'
      };
      const prayerName = keyToName[prayerKey] || prayerKey;
      
      // Alarm state'ini doğrudan güncelle
      const event = new CustomEvent('showAlarm', { detail: { prayer: prayerName } });
      window.dispatchEvent(event);
    }
  } catch (e) {
    console.warn("Doğrudan alarm tetikleme başarısız:", e);
  }
};

// ============================================================
// UYGULAMA BAŞLANGIÇTA ALARM KONTROLÜ
// ============================================================
const checkForPendingAlarm = async () => {
  try {
    // Uygulama bildirimle açıldıysa, alarm verisini kontrol et
    const urlParams = new URLSearchParams(window.location.search);
    const prayer = urlParams.get('prayer');
    if (prayer) {
      // URL'den prayer parametresini temizle
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Kısa bir gecikme ile alarm ekranını göster
      setTimeout(() => {
        const keyToName: Record<string, string> = {
          imsak: 'İmsak', gunes: 'Güneş', ogle: 'Öğle',
          ikindi: 'İkindi', aksam: 'Akşam', yatsi: 'Yatsı'
        };
        const prayerName = keyToName[prayer] || prayer;
        
        // Alarm state'ini doğrudan güncelle
        const event = new CustomEvent('showAlarm', { detail: { prayer: prayerName } });
        window.dispatchEvent(event);
      }, 500);
    }
  } catch (e) {
    console.warn("Başlangıç alarm kontrolü başarısız:", e);
  }
};

// ============================================================
// APP COMPONENT
// ============================================================
const App: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [prayerData, setPrayerData] = useState<PrayerData | null>(null);
  const [nextPrayer, setNextPrayer] = useState<NextPrayerInfo | null>(null);
  const [isAlarmActive, setIsAlarmActive] = useState<boolean>(false);
  const [activeAlarmPrayer, setActiveAlarmPrayer] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState<boolean>(false);
  const [lastAlarmTime, setLastAlarmTime] = useState<string | null>(null);

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('ezan_app_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);

        // --- MIGRATION LOGIC ---
        if (parsed.useEzanSound !== undefined) {
          parsed.soundType = parsed.useEzanSound ? 'ezan' : 'beep';
          delete parsed.useEzanSound;
        }

        const base = { ...DEFAULT_SETTINGS, ...parsed };
        if (!base.prayerReminders) base.prayerReminders = DEFAULT_SETTINGS.prayerReminders;
        if (!base.locationMode) base.locationMode = 'auto';
        if (!base.soundType) base.soundType = 'ezan';

        return base;
      } catch (e) {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  // ============================================================
  // UYGULAMA BAŞLANGIÇ: Bildirim kanalı + alarm kontrolü
  // ============================================================
  useEffect(() => {
    const init = async () => {
      // Android bildirim kanalı oluştur
      await setupNotificationChannel();
      
      // Başlangıç alarm kontrolü
      await checkForPendingAlarm();
    };
    init();
  }, []);

  // ============================================================
  // ALARM EKRANI GÖSTERİMİ
  // ============================================================
  const showAlarmScreen = useCallback((prayerKey: string) => {
    const keyToName: Record<string, PrayerName> = {
      imsak: PrayerName.Imsak, gunes: PrayerName.Gunes, ogle: PrayerName.Ogle,
      ikindi: PrayerName.Ikindi, aksam: PrayerName.Aksam, yatsi: PrayerName.Yatsi
    };
    setActiveAlarmPrayer(keyToName[prayerKey] || prayerKey);
    setIsAlarmActive(true);
  }, []);

  // Custom event listener for URL-based alarm trigger
  useEffect(() => {
    const handleShowAlarm = (event: any) => {
      showAlarmScreen(event.detail.prayer);
    };

    window.addEventListener('showAlarm', handleShowAlarm);
    return () => {
      window.removeEventListener('showAlarm', handleShowAlarm);
    };
  }, [showAlarmScreen]);

  // ============================================================
  // UYGULAMA BAŞLANGIÇ
  // ============================================================
  useEffect(() => {
    initData();
  }, []);

  // ============================================================
  // DOĞRUDAN ALARM TETİKLEME (Android AlarmManager)
  // ============================================================
  const scheduleDirectAlarm = async (prayerKey: string, scheduleTime: Date, testMode: boolean = false) => {
    try {
      if (Capacitor.isNativePlatform()) {
        // Android'de AlarmManager ile doğrudan alarm tetikleme
        const DirectAlarm = (await import('./services/directAlarm')).default;
        
        await DirectAlarm.scheduleAlarm({
          prayer: prayerKey,
          timestamp: scheduleTime.getTime(),
          autoTrigger: true,
          directLaunch: true,
          testMode: testMode
        });
        
        console.log(`${prayerKey} doğrudan alarmı planlandı: ${scheduleTime.toLocaleString()}`);
      } else {
        // Web ortamında DirectAlarm Web sürümünü kullan
        const DirectAlarm = (await import('./services/directAlarm')).default;
        
        await DirectAlarm.scheduleAlarm({
          prayer: prayerKey,
          timestamp: scheduleTime.getTime(),
          autoTrigger: true,
          directLaunch: true,
          testMode: testMode
        });
      }
    } catch (error) {
      console.error('Doğrudan alarm planlama hatası:', error);
      // Fallback olarak normal bildirim kullan
      await LocalNotifications.schedule({
        notifications: [{
          id: Math.floor(scheduleTime.getTime() / 1000),
          title: testMode ? 'Test Alarmı' : 'Ezan Vakti',
          body: testMode ? '1 dakika sonra test alarmı' : `${prayerKey} vakti geldi`,
          schedule: { at: scheduleTime },
          channelId: 'ezan_alarm_direct',
          sound: 'default',
          silent: false,
          autoCancel: true,
          extra: { 
            prayer: prayerKey, 
            autoTrigger: 'true', 
            directLaunch: 'true',
            testMode: testMode ? 'true' : 'false'
          },
          actionTypeId: 'OPEN_APP_ACTION'
        }]
      });
    }
  };

  // ============================================================
  // DOĞRUDAN ALARMLARI PLANLAMA (Bildirimsiz)
  // ============================================================
  const scheduleDirectAlarms = useCallback(async (data: PrayerData, currentSettings: AppSettings) => {
    try {
      if (!currentSettings.notificationsEnabled) {
        console.log("Alarm servisleri kapalı.");
        return;
      }

      // Önce mevcut bildirimleri temizle
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel(pending);
      }

      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);

      const scheduleForDate = (dateObj: Date) => {
        const dateKey = `${dateObj.getDate().toString().padStart(2, '0')}.${(dateObj.getMonth() + 1).toString().padStart(2, '0')}.${dateObj.getFullYear()}`;

        const cachedRaw = localStorage.getItem('ezan_diyanet_v60');
        if (!cachedRaw) return;
        const cached = JSON.parse(cachedRaw);
        const dayTimes = cached.days[dateKey];
        if (!dayTimes) return;

        Object.keys(dayTimes).forEach((key, idx) => {
          const [h, m] = dayTimes[key].split(':').map(Number);
          const scheduleTime = new Date(dateObj);
          scheduleTime.setHours(h, m, 0, 0);

          const offset = currentSettings.prayerReminders[key] || 0;
          scheduleTime.setMinutes(scheduleTime.getMinutes() - offset);

          if (scheduleTime > new Date()) {
            // Tam ekran intent ile bildirim oluştur - otomatik uygulamayı açmak için
            LocalNotifications.schedule({
              notifications: [{
                id: Math.floor(scheduleTime.getTime() / 1000) + idx,
                title: 'Ezan Vakti', // Kısa başlık
                body: `${key} vakti geldi`, // Kısa mesaj
                schedule: { at: scheduleTime },
                channelId: 'ezan_alarm_direct',
                sound: '', // Sessiz - alarm sesi uygulama içinde çalacak
                silent: false, // Sessiz değil - sistem tarafından işlensin
                autoCancel: true,
                extra: { 
                  prayer: key, 
                  autoTrigger: 'true', 
                  directLaunch: 'true'
                }
              }]
            }).then(() => {
              console.log(`${key} otomatik alarmı planlandı: ${scheduleTime.toLocaleString()}`);
            }).catch(e => {
              console.error(`${key} alarmı planlanamadı:`, e);
            });
          }
        });
      };

      scheduleForDate(today);
      scheduleForDate(tomorrow);

    } catch (e) {
      console.error("Doğrudan alarm planlama hatası:", e);
    }
  }, []);

  useEffect(() => {
    if (prayerData) {
      scheduleDirectAlarms(prayerData, settings);
    }
  }, [prayerData, settings]);

  // ============================================================
  // ALARM EKRANI GÖSTERİMİ (Bildirim ve intent için)
  // ============================================================
  useEffect(() => {
    // Native platform intent'leri için alarm ekranı gösterimi
    const handleShowAlarm = (event: any) => {
      showAlarmScreen(event.detail.prayer);
    };

    window.addEventListener('showAlarm', handleShowAlarm);
    
    // Bildirim listener'ları - otomatik alarm tetikleme
    const actionListener = LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
      const prayer = notification.notification?.extra?.prayer;
      const autoTrigger = notification.notification?.extra?.autoTrigger;
      const directLaunch = notification.notification?.extra?.directLaunch;
      const testMode = notification.notification?.extra?.testMode;
      
      // Test modu kontrolü
      if (testMode === 'true') {
        console.log('Test alarmı tetiklendi:', prayer);
        showAlarmScreen(prayer);
        return;
      }
      
      // Otomatik alarm tetikleme
      if (prayer && autoTrigger === 'true' && directLaunch === 'true') {
        console.log('Otomatik alarm tetiklendi:', prayer);
        showAlarmScreen(prayer);
      }
    });

    // Uygulama açıkken bildirim tetiklendiğinde
    const receiveListener = LocalNotifications.addListener('localNotificationReceived', (notification) => {
      const prayer = notification.extra?.prayer;
      const autoTrigger = notification.extra?.autoTrigger;
      const directLaunch = notification.extra?.directLaunch;
      const testMode = notification.extra?.testMode;
      
      // Test modu kontrolü
      if (testMode === 'true') {
        console.log('Test alarmı received:', prayer);
        showAlarmScreen(prayer);
        return;
      }
      
      // Otomatik alarm tetikleme
      if (prayer && autoTrigger === 'true' && directLaunch === 'true') {
        console.log('Otomatik alarm received:', prayer);
        showAlarmScreen(prayer);
      }
    });

    return () => {
      window.removeEventListener('showAlarm', handleShowAlarm);
      actionListener.then(h => h.remove());
      receiveListener.then(h => h.remove());
    };
  }, [showAlarmScreen]);

  // ============================================================
  // VERİ YÜKLEME VE İZİNLER
  // ============================================================
  const initData = async (overrideSettings?: AppSettings) => {
    try {
      setLoading(true);
      setError(null);
      
      // Minimum 1.5 saniye yükleme ekranı göster
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const currentSettings = overrideSettings || settings;
      let lat = DEFAULT_COORDS.latitude;
      let lng = DEFAULT_COORDS.longitude;
      let cityOverride: string | undefined;

      if (currentSettings.locationMode === 'auto') {
        try {
          const position = await Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000
          });
          lat = position.coords.latitude;
          lng = position.coords.longitude;
        } catch (e) {
          console.warn("Konum alınamadı, İstanbul kullanılıyor.", e);
        }
      } else if (currentSettings.locationMode === 'manual' && currentSettings.manualLocation) {
        lat = currentSettings.manualLocation.coords.latitude;
        lng = currentSettings.manualLocation.coords.longitude;
        cityOverride = currentSettings.manualLocation.city;
      }

      const data = await fetchPrayerTimes(lat, lng, cityOverride);
      setPrayerData(data);
      updateNextPrayer(data.times);

      // Arka plan bildirimlerini planla
      scheduleDirectAlarms(data, currentSettings);

    } catch (err) {
      setError("Veri alınamadı. İnternet bağlantınızı kontrol edin.");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // AYAR GÜNCELLEMELERİ
  // ============================================================
  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem('ezan_app_settings', JSON.stringify(newSettings));
    } catch (e) {
      console.error("Ayarlar kaydedilemedi:", e);
      if (newSettings.soundType === 'custom') {
        alert("Uyarı: Ses dosyası hafızaya kaydedilemedi (çok büyük).");
      }
    }
  };

  const handleLocationSelect = (mode: 'auto' | 'manual', manualData?: ManualLocation) => {
    // Şehir değiştiğinde önbelleği temizle
    localStorage.removeItem('ezan_diyanet_v60');
    
    const newSettings = {
      ...settings,
      locationMode: mode,
      manualLocation: manualData
    };
    handleUpdateSettings(newSettings);
    
    // Konum değişiminde güncel ayarlarla verileri yenile
    setTimeout(() => {
      initData(newSettings);
    }, 100);
  };

  // ============================================================
  // GERİ SAYIM VE ÖN PLAN ALARM KONTROLÜ
  // ============================================================
  const updateNextPrayer = useCallback((times: any) => {
    if (!times) return;
    const { nextKey, isTomorrow } = calculateNextPrayer(times);
    const timeStr = times[nextKey];

    const keyToName: Record<string, PrayerName> = {
      imsak: PrayerName.Imsak, gunes: PrayerName.Gunes, ogle: PrayerName.Ogle,
      ikindi: PrayerName.Ikindi, aksam: PrayerName.Aksam, yatsi: PrayerName.Yatsi
    };

    const diff = getTimeDifferenceMinutes(timeStr, isTomorrow);
    setNextPrayer({
      name: keyToName[nextKey],
      key: nextKey,
      time: timeStr,
      minutesRemaining: diff,
      isTomorrow
    });
  }, []);

  useEffect(() => {
    if (!prayerData) return;

    const timer = setInterval(() => {
      if (!prayerData || isAlarmActive || !settings.notificationsEnabled) return;

      updateNextPrayer(prayerData.times);

      const { nextKey, isTomorrow } = calculateNextPrayer(prayerData.times);
      const timeStr = prayerData.times[nextKey];
      const freshRemaining = getTimeDifferenceMinutes(timeStr, isTomorrow);
      const triggerTime = settings.prayerReminders[nextKey] ?? 0;
      const currentAlarmKey = `${new Date().toDateString()}-${nextKey}-${triggerTime}`;

      if (freshRemaining <= triggerTime) {
        setLastAlarmTime(prev => {
          if (prev !== currentAlarmKey) {
            const keyToName: Record<string, PrayerName> = {
              imsak: PrayerName.Imsak, gunes: PrayerName.Gunes, ogle: PrayerName.Ogle,
              ikindi: PrayerName.Ikindi, aksam: PrayerName.Aksam, yatsi: PrayerName.Yatsi
            };
            setActiveAlarmPrayer(keyToName[nextKey] || nextKey);
            setIsAlarmActive(true);
            return currentAlarmKey;
          }
          return prev;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [prayerData, settings, updateNextPrayer]);

  // ============================================================
  // TEST FONKSİYONU - DOĞRUDAN ALARM MANAGER
  // ============================================================
  const handleTestSequence = async () => {
    try {
      console.log('DOĞRUDAN ALARM MANAGER - Test dizisi başlatılıyor...');
      
      // 1. Arka plan servisini başlat (1 dakika sonra alarm için)
      const testAlarmTime = new Date();
      testAlarmTime.setMinutes(testAlarmTime.getMinutes() + 1);
      
      if (Capacitor.isNativePlatform()) {
        // Android'de doğrudan AlarmManager kullan
        try {
          console.log('Doğrudan AlarmManager deneniyor...');
          
          // DirectAlarm plugin kullanarak alarmı planla
          const DirectAlarm = (await import('./services/directAlarm')).default;
          await DirectAlarm.scheduleAlarm({
            prayer: 'test_ogle',
            timestamp: testAlarmTime.getTime()
          });
          
          console.log('Doğrudan AlarmManager çağrısı başarılı');
        } catch (error) {
          console.log('Doğrudan AlarmManager başarısız, bildirim denenıyor:', error);
          
          // Fallback: Bildirim kullan
          await LocalNotifications.schedule({
            notifications: [{
              id: Math.floor(testAlarmTime.getTime() / 1000),
              title: '🔥 TEST ALARMI',
              body: '1 dakika sonra OTOMATİK açılacak - LÜTFEN BEKLEYİN!',
              schedule: { at: testAlarmTime },
              channelId: 'ezan_alarm_direct',
              sound: 'default',
              silent: false,
              autoCancel: true,
              extra: { 
                prayer: 'test_ogle', 
                autoTrigger: 'true', 
                directLaunch: 'true',
                testMode: 'true',
                forceAutoOpen: 'true'
              },
              actionTypeId: 'OPEN_APP_ACTION'
            }]
          });
        }
      } else {
        // Web ortamında normal bildirim kullan
        await LocalNotifications.schedule({
          notifications: [{
            id: Math.floor(testAlarmTime.getTime() / 1000),
            title: 'Test Alarmı',
            body: '1 dakika sonra test alarmı',
            schedule: { at: testAlarmTime },
            channelId: 'ezan_alarm_direct',
            sound: 'default',
            silent: false,
            autoCancel: true,
            extra: { 
              prayer: 'test_ogle', 
              autoTrigger: 'true', 
              directLaunch: 'true',
              testMode: 'true'
            },
            actionTypeId: 'OPEN_APP_ACTION'
          }]
        });
      }
      
      console.log('Test alarmı planlandı:', testAlarmTime.toLocaleString());
      
      // 2. Uygulamayı kapat
      if (Capacitor.isNativePlatform()) {
        setTimeout(() => {
          console.log('Uygulama kapatılıyor...');
          CapacitorApp.exitApp();
        }, 2000); // 2 saniye bekle
      } else {
        // Web ortamında sadece mesaj göster
        alert('Test alarmı 1 dakika sonra planlandı. Web ortamında uygulama kapatılamaz.');
      }
      
    } catch (error) {
      console.error('Test dizisi hatası:', error);
      alert('Test dizisi başlatılamadı: ' + error);
    }
  };

  // ============================================================
  // ALARM DURDURMA
  // ============================================================
  const handleStopAlarm = () => {
    setIsAlarmActive(false);
    
    // Uygulamayı kapat
    if (Capacitor.isNativePlatform()) {
      // Android için uygulama kapatma
      CapacitorApp.exitApp();
    }
  };

  // ============================================================
  // ALARM ZAMANI GÖSTERİMİ
  // ============================================================
  const alarmTimeDisplay = useMemo(() => {
    if (!nextPrayer) return null;
    const reminderMinutes = settings.prayerReminders[nextPrayer.key] ?? 0;

    if (reminderMinutes === 0) return "Tam Vaktinde";

    const [h, m] = nextPrayer.time.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m - reminderMinutes);

    const alarmH = d.getHours().toString().padStart(2, '0');
    const alarmM = d.getMinutes().toString().padStart(2, '0');

    return `${alarmH}:${alarmM} (${reminderMinutes} dk önce)`;
  }, [nextPrayer, settings.prayerReminders]);

  // ============================================================
  // YÜKLEME EKRANI
  // ============================================================
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-particle"></div>
        <div className="loading-particle"></div>
        <div className="loading-particle"></div>
        <div className="loading-particle"></div>
        <div className="loading-particle"></div>
        <div className="loading-particle"></div>

        <div className="loading-logo-wrapper">
          <div className="loading-logo-glow"></div>
          <div className="loading-ring"></div>
          <div className="loading-ring-outer"></div>
          <img src={appLogo} alt="Ezan Vakti Logo" />
        </div>

        <div className="loading-title">Sade Ezan Vakti</div>
        <div className="loading-subtitle">NAMAZ VAKİTLERİ YÜKLENİYOR</div>

        <div className="loading-dots">
          <div className="loading-dot"></div>
          <div className="loading-dot"></div>
          <div className="loading-dot"></div>
        </div>

        <div className="loading-shimmer-container">
          <div className="loading-shimmer-bar"></div>
        </div>

        <div className="loading-footer">v2.0 • Diyanet İşleri Başkanlığı Resmi Verileri</div>
      </div>
    );
  }

  // ============================================================
  // HATA EKRANI
  // ============================================================
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <p className="text-red-600 text-2xl font-bold mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="bg-primary text-white px-8 py-4 rounded-xl text-xl font-bold">Tekrar Dene</button>
      </div>
    );
  }

  // ============================================================
  // ANA EKRAN
  // ============================================================
  return (
    <div className="flex flex-col h-full relative">
      {/* Alarm Overlay */}
      {isAlarmActive && (
        <AlarmOverlay
          prayerName={activeAlarmPrayer}
          onStop={handleStopAlarm}
          settings={settings}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onOpenLocationSelect={() => setIsLocationModalOpen(true)}
        currentCityName={prayerData?.city}
        prayerData={prayerData}
      />

      {/* Location Modal */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onSelectLocation={handleLocationSelect}
        currentMode={settings.locationMode}
        currentCity={settings.manualLocation?.city}
      />

      {/* Header */}
      <header className="pt-8 pb-4 px-6 bg-white shadow-sm flex justify-between items-center z-10">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Sade Ezan Vakti</h1>
          <div className="flex items-center text-slate-500 mt-1">
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            <span className="text-lg font-medium">{prayerData?.city}</span>
          </div>
          {prayerData?.source && (
            <div className="text-xs text-green-600 font-medium mt-0.5">{prayerData.source}</div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleTestSequence}
            className="p-4 bg-orange-100 rounded-xl hover:bg-orange-200 active:bg-orange-300 transition-colors"
            aria-label="Test"
          >
            <svg className="w-8 h-8 text-orange-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-4 bg-slate-100 rounded-xl hover:bg-slate-200 active:bg-slate-300 transition-colors"
            aria-label="Ayarlar"
          >
            <svg className="w-8 h-8 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-6 bg-slate-50">

        {/* Next Prayer Hero Section */}
        <div className="m-2 sm:m-4 mt-6 p-4 sm:p-8 bg-white rounded-3xl shadow-lg border-2 border-primary/20 text-center">
          <h2 className="text-xl font-bold text-slate-500 uppercase tracking-widest mb-2">SIRADAKİ VAKİT</h2>
          <div className="text-4xl sm:text-6xl font-black text-slate-900 mb-2 tracking-tight">
            {nextPrayer?.name}
          </div>
          <div className="text-4xl font-bold text-primary mb-2">
            {nextPrayer?.time}
          </div>

          <div className="text-sm sm:text-lg font-bold text-slate-400 mb-6 flex items-center justify-center gap-2 bg-slate-50 py-2 px-4 rounded-xl inline-block mx-auto">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
            Alarm: {alarmTimeDisplay}
          </div>

          <div className="inline-block bg-primary/10 px-6 py-3 rounded-full w-full">
            <span className="text-2xl font-bold text-primary block">
              Kalan: {Math.floor((nextPrayer?.minutesRemaining || 0) / 60)}s {(nextPrayer?.minutesRemaining || 0) % 60}dk
            </span>
          </div>
        </div>

        {/* Prayer List */}
        <div className="mx-2 sm:mx-4 mt-6 space-y-2 sm:space-y-3">
          {PrayerKeys.map((key) => {
            const map: Record<string, string> = {
              imsak: 'İmsak', gunes: 'Güneş', ogle: 'Öğle', ikindi: 'İkindi', aksam: 'Akşam', yatsi: 'Yatsı'
            };
            const name = map[key];
            const time = prayerData?.times[key];
            const isNext = nextPrayer?.key === key;

            return (
              <div
                key={key}
                className={`flex justify-between items-center p-3 sm:p-5 rounded-2xl transition-all ${isNext ? 'bg-primary text-white shadow-md scale-105 border-2 border-green-500' : 'bg-white text-slate-600 border border-slate-100'}`}
              >
                <span className={`text-xl sm:text-2xl font-bold ${isNext ? 'text-white' : 'text-slate-500'}`}>{name}</span>
                <span className={`text-2xl sm:text-3xl font-bold ${isNext ? 'text-white' : 'text-slate-800'}`}>{time}</span>
              </div>
            )
          })}
        </div>

      </main>

      {/* Footer */}
      <div className="p-4 text-center text-slate-400 text-sm">
        Sade Ezan Vakti v2.0 • Diyanet İşleri Başkanlığı Resmi Verileri
      </div>
    </div>
  );
};

export default App;
