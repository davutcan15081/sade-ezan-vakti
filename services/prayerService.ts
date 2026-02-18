import { PrayerData, PrayerTimes } from '../types';
import { TURKEY_CITIES, DIYANET_API_BASE } from '../constants';
import { CapacitorHttp } from '@capacitor/core';

const YEARLY_CACHE_KEY = 'ezan_diyanet_v60';
const DISTRICT_CACHE_KEY = 'ezan_district_cache';

// ============================================================
// ANA FONKSİYON: Namaz vakitlerini getir
// Öncelik: 1) Önbellek  2) Diyanet Resmi API  3) Eski proxy'ler  4) Son çare offline mod
// ============================================================
export const fetchPrayerTimes = async (lat: number, lng: number, cityOverride?: string): Promise<PrayerData> => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const todayKey = `${now.getDate().toString().padStart(2, '0')}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${currentYear}`;

    const cityNameRaw = cityOverride || findNearestCity(lat, lng) || 'İstanbul';
    const cityName = cityNameRaw;

    // 1. ÖNBELLEK KONTROLÜ (Sonsuz süre, sadece şehir değişiminde temizlenir)
    const cached = localStorage.getItem(YEARLY_CACHE_KEY);
    if (cached) {
        try {
            const fullData = JSON.parse(cached);
            if (fullData.city === cityName && fullData.days && fullData.days[todayKey]) {
                return {
                    date: todayKey,
                    times: fullData.days[todayKey],
                    city: fullData.city,
                    isOffline: true,
                    source: fullData.source || "Diyanet İşleri Başkanlığı (Önbellek)"
                };
            }
        } catch (e) { /* önbellek bozuksa yeniden çek */ }
    }

    // 2. DİYANET RESMİ API (ezanvakti.emushaf.net) - 1 YILLIK VERİ
    try {
        const data = await fetchFromDiyanetOfficial(cityName);
        if (data && data.days[todayKey]) {
            return {
                date: todayKey,
                times: data.days[todayKey],
                city: cityName,
                source: "Diyanet İşleri Başkanlığı (Resmi)"
            };
        }
    } catch (e) {
        console.warn("Diyanet resmi API başarısız, yedek kaynaklar deneniyor...", e);
    }

    // 3. YEDEK PROXY KANALLARI
    const citySlug = getDiyanetSlug(cityName.toLocaleUpperCase('tr-TR'));
    const proxyEndpoints = [
        `https://vakit.vercel.app/api/timesFromCity?city=${citySlug}`,
        `https://ezanvaktitapi.vercel.app/api/timesFromCity?city=${citySlug}`,
        `https://namaz-vakitleri.vercel.app/api/timesFromCity?city=${citySlug}`
    ];

    for (const url of proxyEndpoints) {
        try {
            console.warn(`Fetching from: ${url}`);
            const response = await CapacitorHttp.get({ url });
            console.warn(`Response received:`, response);
            const data = response.data;
            if (Array.isArray(data) && data.length > 0) {
                const daysMap: Record<string, PrayerTimes> = {};
                data.forEach((item: any) => {
                    daysMap[item.date] = {
                        imsak: item.imsak, gunes: item.gunes, ogle: item.ogle,
                        ikindi: item.ikindi, aksam: item.aksam, yatsi: item.yatsi
                    };
                });

                const sourceInfo = "Diyanet Uyumlu (Proxy)";
                localStorage.setItem(YEARLY_CACHE_KEY, JSON.stringify({
                    city: cityName, days: daysMap, source: sourceInfo
                }));

                if (daysMap[todayKey]) {
                    return { date: todayKey, times: daysMap[todayKey], city: cityName, source: sourceInfo };
                }
            }
        } catch (e) {
            console.warn("Proxy kanal meşgul, diğeri deneniyor...");
        }
    }

    // 4. SON ÇARE: OFFLINE MOD - Herhangi bir önbellek varsa kullan
    try {
        const anyCached = localStorage.getItem(YEARLY_CACHE_KEY);
        if (anyCached) {
            const fullData = JSON.parse(anyCached);
            if (fullData.days && Object.keys(fullData.days).length > 0) {
                // En yakın tarihi bul
                const cachedDates = Object.keys(fullData.days).sort();
                const closestDate = cachedDates.find(date => {
                    const [day, month, year] = date.split('.').map(Number);
                    const cacheDate = new Date(year, month - 1, day);
                    return cacheDate >= now;
                }) || cachedDates[cachedDates.length - 1]; // En son tarih
                
                if (fullData.days[closestDate]) {
                    return {
                        date: todayKey,
                        times: fullData.days[closestDate],
                        city: fullData.city || cityName,
                        isOffline: true,
                        source: `${fullData.source || "Önbellek"} (Offline Mod)`
                    };
                }
            }
        }
    } catch (e) {
        console.error("Offline mod da başarısız:", e);
    }

    throw new Error("Diyanet verilerine şu an ulaşılamıyor. Lütfen internet bağlantınızı kontrol edin ve uygulamayı yeniden başlatın.");
};

// ============================================================
// DİYANET RESMİ API - İlçe ID'sini bul ve vakitleri çek
// ============================================================
const fetchFromDiyanetOfficial = async (cityName: string): Promise<{ days: Record<string, PrayerTimes>; source: string } | null> => {
    // Şehir bilgisini bul
    const cityInfo = TURKEY_CITIES.find(c => c.name === cityName);
    if (!cityInfo) return null;

    // İlçe ID'sini al (önbellekten veya API'den)
    const ilceId = await getDiyanetDistrictId(cityInfo.sehirId, cityName);
    if (!ilceId) return null;

    // Namaz vakitlerini çek
    const response = await CapacitorHttp.get({ url: `${DIYANET_API_BASE}/vakitler/${ilceId}` });

    const rawData = response.data;
    if (!Array.isArray(rawData) || rawData.length === 0) throw new Error("Boş veri");

    // Diyanet API yanıtını uygulama formatına dönüştür
    const daysMap: Record<string, PrayerTimes> = {};
    rawData.forEach((item: any) => {
        const dateKey = item.MiladiTarihKisa; // "13.02.2026" formatı
        if (dateKey) {
            daysMap[dateKey] = {
                imsak: item.Imsak,
                gunes: item.Gunes,
                ogle: item.Ogle,
                ikindi: item.Ikindi,
                aksam: item.Aksam,
                yatsi: item.Yatsi
            };
        }
    });

    const source = "Diyanet İşleri Başkanlığı (Resmi)";

    // Önbelleğe kaydet
    localStorage.setItem(YEARLY_CACHE_KEY, JSON.stringify({
        city: cityName, days: daysMap, source
    }));

    return { days: daysMap, source };
};

// ============================================================
// İlçe ID'sini bul (şehir merkezi)
// ============================================================
const getDiyanetDistrictId = async (sehirId: string, cityName: string): Promise<string | null> => {
    // Önbellekten kontrol
    const districtCache = localStorage.getItem(DISTRICT_CACHE_KEY);
    if (districtCache) {
        try {
            const cache = JSON.parse(districtCache);
            if (cache[sehirId]) return cache[sehirId];
        } catch (e) { /* */ }
    }

    // API'den ilçeleri çek
    const response = await CapacitorHttp.get({ url: `${DIYANET_API_BASE}/ilceler/${sehirId}` });

    const districts = response.data;
    if (!Array.isArray(districts) || districts.length === 0) return null;

    // Şehir merkezini bul: ilçe adı şehir adıyla aynı olan veya ilk ilçe
    const normalizedCity = normalizeTurkish(cityName);
    const centerDistrict = districts.find((d: any) =>
        normalizeTurkish(d.IlceAdi) === normalizedCity ||
        normalizeTurkish(d.IlceAdiEn) === normalizedCity
    ) || districts[0];

    const ilceId = centerDistrict.IlceID;

    // Önbelleğe kaydet
    const existingCache = districtCache ? JSON.parse(districtCache) : {};
    existingCache[sehirId] = ilceId;
    localStorage.setItem(DISTRICT_CACHE_KEY, JSON.stringify(existingCache));

    return ilceId;
};

// ============================================================
// YARDIMCI FONKSİYONLAR
// ============================================================

const normalizeTurkish = (str: string): string => {
    return str
        .replace(/İ/g, 'i').replace(/I/g, 'i').replace(/ı/g, 'i')
        .replace(/Ğ/g, 'g').replace(/ğ/g, 'g')
        .replace(/Ü/g, 'u').replace(/ü/g, 'u')
        .replace(/Ş/g, 's').replace(/ş/g, 's')
        .replace(/Ö/g, 'o').replace(/ö/g, 'o')
        .replace(/Ç/g, 'c').replace(/ç/g, 'c')
        .toLowerCase().trim();
};

const getDiyanetSlug = (str: string): string => {
    return normalizeTurkish(str).replace(/\s+/g, '-');
};

export const calculateNextPrayer = (times: PrayerTimes): { nextKey: string, isTomorrow: boolean } => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const keys = ['imsak', 'gunes', 'ogle', 'ikindi', 'aksam', 'yatsi'];
    for (const key of keys) {
        const t = times[key];
        if (!t) continue;
        const [h, m] = t.split(':').map(Number);
        if ((h * 60 + m) > currentMinutes) return { nextKey: key, isTomorrow: false };
    }
    return { nextKey: 'imsak', isTomorrow: true };
}

export const getTimeDifferenceMinutes = (targetTimeStr: string, isTomorrow: boolean): number => {
    const now = new Date();
    const [targetH, targetM] = targetTimeStr.split(':').map(Number);
    let target = new Date();
    target.setHours(targetH, targetM, 0, 0);
    if (isTomorrow) target.setDate(target.getDate() + 1);
    return Math.floor((target.getTime() - now.getTime()) / 1000 / 60);
}

const findNearestCity = (lat: number, lng: number): string | null => {
    let minDist = Infinity; let nearest = null;
    for (const c of TURKEY_CITIES) {
        const d = Math.sqrt(Math.pow(lat - c.lat, 2) + Math.pow(lng - c.lng, 2));
        if (d < minDist) { minDist = d; nearest = c.name; }
    }
    return nearest;
}
