import React, { useState, useMemo } from 'react';
import { ArrowLeft, MapPin, Search, Navigation } from 'lucide-react';
import { TURKEY_CITIES } from '../constants';
import { ManualLocation } from '../types';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (locationMode: 'auto' | 'manual', manualData?: ManualLocation) => void;
  currentMode: 'auto' | 'manual';
  currentCity?: string;
}

const LocationModal: React.FC<LocationModalProps> = ({ isOpen, onClose, onSelectLocation, currentMode, currentCity }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCities = useMemo(() => {
    if (!searchTerm) return TURKEY_CITIES;
    const lower = searchTerm.toLocaleLowerCase('tr-TR');
    return TURKEY_CITIES.filter(c => c.name.toLocaleLowerCase('tr-TR').includes(lower));
  }, [searchTerm]);

  if (!isOpen) return null;

  const handleAuto = () => {
    onSelectLocation('auto');
    onClose();
  };

  const handleManual = (city: typeof TURKEY_CITIES[0]) => {
    onSelectLocation('manual', {
      city: city.name,
      coords: { latitude: city.lat, longitude: city.lng }
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-50 flex flex-col h-full w-full">
      {/* Header */}
      <div className="px-6 py-5 flex items-center gap-4 bg-slate-50 border-b border-slate-100/50 sticky top-0 z-10">
        <button
          onClick={onClose}
          className="p-3 bg-white rounded-full shadow-sm border border-slate-200 active:bg-slate-100"
        >
          <ArrowLeft className="w-6 h-6 text-slate-700" />
        </button>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Konum Seç</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 pb-10">

        {/* GPS Option */}
        <button
          onClick={handleAuto}
          className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 mb-8 transition-all ${currentMode === 'auto' ? 'border-primary bg-green-50 shadow-md' : 'border-slate-200 bg-white shadow-sm'}`}
        >
          <div className={`p-3 rounded-full ${currentMode === 'auto' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
            <Navigation className="w-6 h-6" />
          </div>
          <div className="text-left">
            <div className="font-bold text-xl text-slate-900">Otomatik Konum (GPS)</div>
            <div className="text-slate-500">Konumunuzu otomatik bulur</div>
          </div>
          {currentMode === 'auto' && <div className="ml-auto text-primary font-bold">SEÇİLİ</div>}
        </button>

        {/* Search */}
        <div className="relative mb-6">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <input
            type="text"
            placeholder="Şehir ara..."
            className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-14 pr-4 text-xl font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-slate-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Cities List */}
        <div className="space-y-3">
          {filteredCities.map((city) => {
            const isSelected = currentMode === 'manual' && currentCity === city.name;
            return (
              <button
                key={city.name}
                onClick={() => handleManual(city)}
                className={`w-full flex items-center justify-between p-5 rounded-2xl bg-white border transition-all active:scale-95 ${isSelected ? 'border-primary shadow-md ring-1 ring-primary' : 'border-slate-100 shadow-sm'}`}
              >
                <div className="flex items-center gap-3">
                  <MapPin className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-slate-300'}`} />
                  <span className={`text-xl font-bold ${isSelected ? 'text-primary' : 'text-slate-700'}`}>{city.name}</span>
                </div>
              </button>
            );
          })}
          {filteredCities.length === 0 && (
            <div className="text-center py-10 text-slate-400 text-lg">
              Şehir bulunamadı.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationModal;