import React from 'react';
import { PrayerData, NextPrayerInfo, AppSettings, PrayerName } from '../types';
import { Settings, MapPin, Clock, Calendar, Info } from 'lucide-react';

interface MainDisplayProps {
    prayerData: PrayerData;
    nextPrayer: NextPrayerInfo | null;
    onOpenSettings: () => void;
    settings: AppSettings;
}

const MainDisplay: React.FC<MainDisplayProps> = ({ prayerData, nextPrayer, onOpenSettings, settings }) => {
    const prayerOrder = ['imsak', 'gunes', 'ogle', 'ikindi', 'aksam', 'yatsi'];

    const formatRemainingTime = (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h > 0 ? h + ' saat ' : ''}${m} dakika`;
    };

    return (
        <div className="flex flex-col min-h-screen">
            {/* Header Overlay */}
            <div className="p-6 flex justify-between items-start z-10">
                <div>
                    <div className="flex items-center gap-2 text-green-400 font-black tracking-widest text-sm mb-1">
                        <MapPin className="w-4 h-4" />
                        <span className="uppercase">{settings.locationName || prayerData.city}</span>
                    </div>
                    <p className="text-slate-400 text-xs font-bold flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        %100 Resmi Diyanet Verisi
                    </p>
                </div>
                <button
                    onClick={onOpenSettings}
                    className="w-14 h-14 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center active:scale-95 transition-transform"
                >
                    <Settings className="w-7 h-7 text-white" />
                </button>
            </div>

            {/* Hero Section: Geri Sayım */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 -mt-10">
                {nextPrayer && (
                    <div className="text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 font-bold text-sm mb-6 animate-pulse">
                            <Clock className="w-4 h-4" />
                            SIRADAKİ: {nextPrayer.name.toUpperCase()}
                        </div>

                        <h1 className="text-8xl font-black tracking-tighter mb-4 text-white drop-shadow-2xl">
                            {formatRemainingTime(nextPrayer.minutesRemaining)}
                        </h1>

                        <p className="text-2xl text-slate-400 font-medium">
                            ezana vakit kaldı
                        </p>
                    </div>
                )}
            </div>

            {/* Vakit Listesi */}
            <div className="p-6 pb-safe-offset-8">
                <div className="grid grid-cols-2 gap-3">
                    {prayerOrder.map((key) => {
                        const isNext = nextPrayer?.key === key;
                        const time = prayerData.times[key];
                        const name = (Object.values(PrayerName) as string[])[prayerOrder.indexOf(key)];

                        return (
                            <div
                                key={key}
                                className={`p-5 rounded-3xl border transition-all duration-500 ${isNext
                                    ? 'bg-green-500 border-green-400 shadow-[0_0_30px_rgba(34,197,94,0.3)] scale-[1.02]'
                                    : 'bg-white/5 border-white/5 active:bg-white/10'
                                    }`}
                            >
                                <div className="flex flex-col gap-1">
                                    <span className={`text-[11px] font-black uppercase tracking-widest ${isNext ? 'text-white/70' : 'text-slate-500'}`}>
                                        {name}
                                    </span>
                                    <span className={`text-3xl font-black ${isNext ? 'text-white' : 'text-white/90'}`}>
                                        {time}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-8 text-center text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                    Sade Ezan Vakti • {new Date().toLocaleDateString('tr-TR')}
                </div>
            </div>
        </div>
    );
};

export default MainDisplay;
