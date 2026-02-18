
import React, { useRef, useEffect, useState } from 'react';
import { AppSettings, PrayerKeys, PrayerName, PrayerData } from '../types';
import { ArrowLeft, Info, Volume2, Smartphone, Check, Sun, Moon, Sunrise, Sunset, CheckCircle, MapPin, Plus, Minus, Music, Bell, Upload, FileAudio, Power, BellOff } from 'lucide-react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: AppSettings;
    onUpdateSettings: (newSettings: AppSettings) => void;
    onOpenLocationSelect: () => void;
    currentCityName?: string;
    prayerData: PrayerData | null;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onUpdateSettings, onOpenLocationSelect, currentCityName, prayerData }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [holdingButtons, setHoldingButtons] = useState<Record<string, boolean>>({});

    if (!isOpen) return null;

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onUpdateSettings({ ...settings, volume: parseFloat(e.target.value) });
    };

    const handleSoundTypeChange = (type: 'ezan' | 'beep' | 'custom') => {
        onUpdateSettings({ ...settings, soundType: type });
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = event.target?.result as string;
                onUpdateSettings({
                    ...settings,
                    soundType: 'custom',
                    customSoundSource: base64,
                    customSoundName: file.name
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const toggleLocationMode = () => {
        onUpdateSettings({
            ...settings,
            locationMode: settings.locationMode === 'auto' ? 'manual' : 'auto'
        });
    };

    const toggleVibration = () => {
        onUpdateSettings({ ...settings, vibrationEnabled: !settings.vibrationEnabled });
    };

    const toggleNotifications = () => {
        onUpdateSettings({ ...settings, notificationsEnabled: !settings.notificationsEnabled });
    };

    const setPrayerReminder = (key: string, minutes: number) => {
        onUpdateSettings({
            ...settings,
            prayerReminders: {
                ...settings.prayerReminders,
                [key]: minutes
            }
        });
    };

    const adjustPrayerReminder = (key: string, delta: number) => {
        const currentMinutes = settings.prayerReminders[key] || 0;
        const newMinutes = Math.max(0, Math.min(60, currentMinutes + delta));
        setPrayerReminder(key, newMinutes);
    };

    const startHolding = (key: string, direction: 'increase' | 'decrease') => {
        setHoldingButtons({ ...holdingButtons, [`${key}-${direction}`]: true });
        const interval = setInterval(() => {
            adjustPrayerReminder(key, direction === 'increase' ? 1 : -1);
        }, 150);
        
        const stopHolding = () => {
            clearInterval(interval);
            setHoldingButtons(prev => ({ ...prev, [`${key}-${direction}`]: false }));
        };
        
        return stopHolding;
    };

    const getPrayerIcon = (key: string) => {
        switch (key) {
            case 'imsak': return <Sunrise className="w-6 h-6 text-orange-400" />;
            case 'gunes': return <Sun className="w-6 h-6 text-yellow-500" />;
            case 'ogle': return <Sun className="w-6 h-6 text-orange-500" />;
            case 'ikindi': return <Sun className="w-6 h-6 text-orange-600" />;
            case 'aksam': return <Sunset className="w-6 h-6 text-red-500" />;
            case 'yatsi': return <Moon className="w-6 h-6 text-indigo-400" />;
            default: return <Bell className="w-6 h-6 text-slate-400" />;
        }
    };

    return (
        <div className="fixed inset-0 z-[50] flex flex-col bg-slate-50 animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="bg-white px-6 py-4 flex items-center gap-4 border-b border-slate-100 sticky top-0 z-10 shadow-sm">
                <button onClick={onClose} className="p-2 -ml-2 hover:bg-slate-50 rounded-full transition-colors">
                    <ArrowLeft className="w-7 h-7 text-slate-800" />
                </button>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Ayarlar</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-6 pb-24 space-y-8">

                {/* Konum Bölümü */}
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 ml-1">KONUM VE BÖLGE</h3>
                <div className="bg-white rounded-3xl p-5 shadow-sm mb-8 border border-slate-100">
                    <div
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setTimeout(() => onOpenLocationSelect(), 100);
                        }}
                        className="flex items-center justify-between py-2 rounded-2xl active:bg-slate-50 transition-colors cursor-pointer"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 shrink-0">
                                <MapPin className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="font-bold text-slate-900 text-xl">{currentCityName || 'Konum Seçilmedi'}</div>
                                <div className="text-slate-500 text-base">{settings.locationMode === 'auto' ? 'Otomatik Tespit' : 'Elle Seçildi'}</div>
                            </div>
                        </div>
                        <div className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl font-bold text-sm">Değiştir</div>
                    </div>

                    {prayerData?.source && (
                        <div className="mt-4 pt-4 border-t border-slate-50 flex items-start gap-2">
                            <Info className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                            <div className="text-xs text-slate-400 font-medium leading-relaxed">
                                Veri Kaynağı: <span className="text-slate-600">{prayerData.source}</span>
                                <br />
                                Takvim: %100 Diyanet Uyumu (awqatsalah)
                            </div>
                        </div>
                    )}
                </div>

                {/* Servis Başlat/Durdur */}
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 ml-1">EZAN SERVİSLERİ</h3>
                <div className="bg-white rounded-3xl p-5 shadow-sm mb-8 space-y-6 border border-slate-100">

                    {/* Bildirim Servisi (Master Switch) */}
                    <div
                        onClick={toggleNotifications}
                        className="flex items-center justify-between py-2 rounded-2xl active:bg-slate-50 transition-colors cursor-pointer"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 ${settings.notificationsEnabled ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'} rounded-full flex items-center justify-center shrink-0`}>
                                {settings.notificationsEnabled ? <Power className="w-6 h-6" /> : <BellOff className="w-6 h-6" />}
                            </div>
                            <div>
                                <div className="font-bold text-slate-900 text-xl">Bildirim Servisi</div>
                                <div className="text-slate-500 text-base">
                                    {settings.notificationsEnabled ? 'Şu an aktif (Ezan okunur)' : 'Duraklatıldı (Ezan okunmaz)'}
                                </div>
                            </div>
                        </div>
                        <div className={`w-16 h-9 rounded-full relative transition-all duration-300 ease-out ${settings.notificationsEnabled ? 'bg-green-500' : 'bg-slate-200'}`}>
                            <div className={`absolute top-1 w-7 h-7 bg-white rounded-full shadow-sm transition-all duration-300 flex items-center justify-center ${settings.notificationsEnabled ? 'left-8' : 'left-1'}`}>
                                {settings.notificationsEnabled && <Check className="w-4 h-4 text-green-500" strokeWidth={4} />}
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-slate-50" />

                    {/* Titreşim Servisi */}
                    <div
                        onClick={toggleVibration}
                        className={`flex items-center justify-between py-2 rounded-2xl active:bg-slate-50 transition-colors cursor-pointer ${!settings.notificationsEnabled ? 'opacity-50 grayscale' : ''}`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 ${settings.vibrationEnabled ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-400'} rounded-full flex items-center justify-center shrink-0`}>
                                <Smartphone className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="font-bold text-slate-900 text-xl">Titreşim Servisi</div>
                                <div className="text-slate-500 text-base">Ezan okunurken telefon titresin</div>
                            </div>
                        </div>
                        <div className={`w-16 h-9 rounded-full relative transition-all duration-300 ease-out ${settings.vibrationEnabled ? 'bg-green-500' : 'bg-slate-200'}`}>
                            <div className={`absolute top-1 w-7 h-7 bg-white rounded-full shadow-sm transition-all duration-300 flex items-center justify-center ${settings.vibrationEnabled ? 'left-8' : 'left-1'}`}>
                                {settings.vibrationEnabled && <Check className="w-4 h-4 text-green-500" strokeWidth={4} />}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Ses Seçimi */}
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 ml-1">SES VE ALARM</h3>
                <div className="bg-white rounded-3xl p-5 shadow-sm space-y-6 border border-slate-100">
                    <div className="grid grid-cols-1 gap-3">
                        <button
                            onClick={() => handleSoundTypeChange('ezan')}
                            className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${settings.soundType === 'ezan' ? 'border-green-500 bg-green-50' : 'border-slate-100 bg-white'}`}
                        >
                            <div className="flex items-center gap-3">
                                <Music className={`w-6 h-6 ${settings.soundType === 'ezan' ? 'text-green-600' : 'text-slate-400'}`} />
                                <span className={`font-bold ${settings.soundType === 'ezan' ? 'text-green-900' : 'text-slate-600'}`}>Resmi Ezan Sesi</span>
                            </div>
                            {settings.soundType === 'ezan' && <CheckCircle className="w-6 h-6 text-green-600 fill-green-600/10" />}
                        </button>

                        <button
                            onClick={() => handleSoundTypeChange('beep')}
                            className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${settings.soundType === 'beep' ? 'border-green-500 bg-green-50' : 'border-slate-100 bg-white'}`}
                        >
                            <div className="flex items-center gap-3">
                                <Bell className={`w-6 h-6 ${settings.soundType === 'beep' ? 'text-green-600' : 'text-slate-400'}`} />
                                <span className={`font-bold ${settings.soundType === 'beep' ? 'text-green-900' : 'text-slate-600'}`}>Kısa Uyarı (Bip)</span>
                            </div>
                            {settings.soundType === 'beep' && <CheckCircle className="w-6 h-6 text-green-600 fill-green-600/10" />}
                        </button>

                        <button
                            className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${settings.soundType === 'custom' ? 'border-green-500 bg-green-50' : 'border-slate-100 bg-white'}`}
                        >
                            <div className="flex items-center gap-3 w-full">
                                <FileAudio className={`w-6 h-6 ${settings.soundType === 'custom' ? 'text-green-600' : 'text-slate-400'}`} />
                                <div className="flex flex-col items-start flex-1 overflow-hidden">
                                    <span className={`font-bold ${settings.soundType === 'custom' ? 'text-green-900' : 'text-slate-600'}`}>Özel Ses Yükle</span>
                                    {settings.customSoundName && <span className="text-xs text-slate-400 truncate w-full">{settings.customSoundName}</span>}
                                </div>
                                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="audio/*" className="hidden" />
                                <div onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} className="p-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-700">
                                    <Upload className="w-5 h-5" />
                                </div>
                            </div>
                        </button>
                    </div>

                    {/* Volume Slider */}
                    <div className="pt-2">
                        <div className="flex justify-between items-center mb-3">
                            <div className="font-bold text-slate-900 text-lg">Ses Seviyesi</div>
                            <span className="text-green-600 font-bold">%{Math.round(settings.volume * 100)}</span>
                        </div>
                        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <Volume2 className="w-5 h-5 text-slate-400" />
                            <input
                                type="range" min="0" max="1" step="0.1"
                                value={settings.volume} onChange={handleVolumeChange}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-green-500"
                            />
                            <Volume2 className="w-7 h-7 text-slate-800" />
                        </div>
                    </div>
                </div>

                {/* Nama Vakti Hatırlatıcıları */}
                <h3 className="text-lg font-bold text-slate-400 uppercase tracking-widest mb-6 ml-1 text-center">NAMAZ VAKTİ UYARILARI</h3>
                <div className="grid grid-cols-1 gap-6">
                    {PrayerKeys.map((key) => (
                        <div key={key} className="bg-white rounded-3xl p-6 shadow-lg border border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center">
                                    {getPrayerIcon(key)}
                                </div>
                                <div className="font-bold text-slate-900 text-2xl">{PrayerName[key as keyof typeof PrayerName]}</div>
                            </div>
                            <div className="flex items-center bg-slate-100 rounded-2xl p-2 gap-3">
                                <button
                                    onMouseDown={() => {
                                        adjustPrayerReminder(key, -1);
                                        const stopHolding = startHolding(key, 'decrease');
                                        document.addEventListener('mouseup', stopHolding, { once: true });
                                        document.addEventListener('touchend', stopHolding, { once: true });
                                    }}
                                    onTouchStart={(e) => {
                                        e.preventDefault();
                                        adjustPrayerReminder(key, -1);
                                        const stopHolding = startHolding(key, 'decrease');
                                        document.addEventListener('touchend', stopHolding, { once: true });
                                    }}
                                    className={`w-12 h-12 rounded-xl font-bold transition-all flex items-center justify-center ${
                                        (settings.prayerReminders[key] || 0) > 0 
                                            ? 'bg-white text-red-500 shadow-md hover:bg-red-50' 
                                            : 'bg-slate-200 text-slate-400'
                                    }`}
                                >
                                    <Minus className="w-6 h-6" />
                                </button>
                                
                                <div className="min-w-[100px] text-center">
                                    <div className="font-bold text-slate-900 text-lg">
                                        {(settings.prayerReminders[key] || 0) === 0 ? 'Tam Vakti' : `${settings.prayerReminders[key]} dk Önce`}
                                    </div>
                                </div>
                                
                                <button
                                    onMouseDown={() => {
                                        adjustPrayerReminder(key, 1);
                                        const stopHolding = startHolding(key, 'increase');
                                        document.addEventListener('mouseup', stopHolding, { once: true });
                                        document.addEventListener('touchend', stopHolding, { once: true });
                                    }}
                                    onTouchStart={(e) => {
                                        e.preventDefault();
                                        adjustPrayerReminder(key, 1);
                                        const stopHolding = startHolding(key, 'increase');
                                        document.addEventListener('touchend', stopHolding, { once: true });
                                    }}
                                    className="w-12 h-12 rounded-xl font-bold transition-all flex items-center justify-center bg-white text-green-500 shadow-md hover:bg-green-50"
                                >
                                    <Plus className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer info */}
                <div className="text-center text-slate-400 text-sm mt-8 space-y-1">
                    <p className="font-medium">Sade Ezan Vakti v2.0</p>
                    <p>© 2026 - Amcamız İçin</p>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
