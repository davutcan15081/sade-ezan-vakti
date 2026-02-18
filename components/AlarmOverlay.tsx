
import React, { useEffect, useRef } from 'react';
import { SOUND_BEEP, SOUND_EZAN } from '../constants';
import { AppSettings } from '../types';

interface AlarmOverlayProps {
  onStop: () => void;
  prayerName: string;
  settings: AppSettings;
}

const AlarmOverlay: React.FC<AlarmOverlayProps> = ({ onStop, prayerName, settings }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const vibrationInterval = useRef<number | null>(null);

  useEffect(() => {
    // 1. Play Sound
    let soundSrc = SOUND_BEEP; // Default fallback

    if (settings.soundType === 'ezan') {
        soundSrc = SOUND_EZAN;
    } else if (settings.soundType === 'custom' && settings.customSoundSource) {
        soundSrc = settings.customSoundSource;
    } else {
        // 'beep' or fallback
        soundSrc = SOUND_BEEP;
    }

    audioRef.current = new Audio(soundSrc);
    
    // Logic for looping:
    // If it's a Beep, loop it.
    // If it's Ezan, usually don't loop.
    // If it's custom, let's assume if it's short we might want to loop, but for safety, let's not loop user files to avoid annoyance, 
    // unless it's the beep setting.
    audioRef.current.loop = settings.soundType === 'beep'; 
    audioRef.current.volume = settings.volume;
    
    // Attempt to play (browser may block if no interaction, but we assume interaction happened previously)
    audioRef.current.play().catch(e => console.warn("Audio play blocked", e));

    // 2. Vibrate
    if (settings.vibrationEnabled && navigator.vibrate) {
      // Vibrate pattern: 500ms on, 300ms off
      navigator.vibrate([500, 300, 500]); 
      // Loop vibration manually since vibrate pattern doesn't loop forever
      vibrationInterval.current = window.setInterval(() => {
        navigator.vibrate([500, 300, 500]);
      }, 2000);
    }

    return () => {
      // Cleanup
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (vibrationInterval.current) {
        clearInterval(vibrationInterval.current);
        if (navigator.vibrate) navigator.vibrate(0);
      }
    };
  }, [settings]);

  return (
    <div className="fixed inset-0 z-50 bg-red-600 flex flex-col items-center justify-center p-6 animate-pulse">
      <h1 className="text-white text-4xl font-bold mb-4 text-center drop-shadow-md">
        EZAN VAKTİ
      </h1>
      <h2 className="text-white text-6xl font-black mb-12 text-center drop-shadow-md uppercase">
        {prayerName}
      </h2>

      <button
        onClick={onStop}
        className="bg-white text-red-600 text-3xl font-bold py-10 px-12 rounded-full shadow-2xl active:scale-95 transition-transform border-4 border-red-800"
      >
        ALARMI DURDUR
      </button>
      
      <p className="text-white/80 mt-12 text-xl font-medium text-center">
        Durdurmak için butona basın
      </p>
    </div>
  );
};

export default AlarmOverlay;
