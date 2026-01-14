import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import type { LatLng } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { ObservationLocation } from '../../types';

// Fix for default marker icon in webpack/vite
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface LocationPickerProps {
  value: ObservationLocation | null;
  onChange: (location: ObservationLocation | null) => void;
  label?: string;
}

interface SearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

function MapClickHandler({ onLocationSelect }: { onLocationSelect: (latlng: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng);
    },
  });
  return null;
}

function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  return null;
}

export function LocationPicker({ value, onChange, label }: LocationPickerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [placeName, setPlaceName] = useState(value?.name || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchLocation = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`
      );
      const data = await response.json();
      setSearchResults(data);
      setShowResults(true);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Debounce search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      searchLocation(query);
    }, 300);
  };

  const handleSelectResult = (result: SearchResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const name = result.display_name.split(',').slice(0, 2).join(',');

    setPlaceName(name);
    setSearchQuery('');
    setShowResults(false);
    setSearchResults([]);

    onChange({ lat, lng, name });
  };

  // Default center: Sweden
  const defaultCenter: [number, number] = [62.0, 15.0];
  const center: [number, number] = value ? [value.lat, value.lng] : defaultCenter;
  const zoom = value ? 10 : 4;

  useEffect(() => {
    setPlaceName(value?.name || '');
  }, [value]);

  const handleLocationSelect = async (latlng: LatLng) => {
    // Try to get place name via reverse geocoding
    let name = '';
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latlng.lat}&lon=${latlng.lng}&format=json`
      );
      const data = await response.json();
      if (data.address) {
        // Build a simple place name
        const parts = [];
        if (data.address.city || data.address.town || data.address.village || data.address.municipality) {
          parts.push(data.address.city || data.address.town || data.address.village || data.address.municipality);
        }
        if (data.address.country) {
          parts.push(data.address.country);
        }
        name = parts.join(', ');
      }
    } catch {
      // Ignore geocoding errors
    }

    setPlaceName(name);
    onChange({
      lat: latlng.lat,
      lng: latlng.lng,
      name,
    });
  };

  const handlePlaceNameChange = (newName: string) => {
    setPlaceName(newName);
    if (value) {
      onChange({ ...value, name: newName });
    }
  };

  const handleClear = () => {
    onChange(null);
    setPlaceName('');
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">{label}</label>
      )}

      {value ? (
        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
          <div className="flex justify-between items-start">
            <div className="text-sm">
              <input
                type="text"
                value={placeName}
                onChange={(e) => handlePlaceNameChange(e.target.value)}
                placeholder="Platsnamn"
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm mb-1"
              />
              <span className="text-gray-500">
                {value.lat.toFixed(4)}, {value.lng.toFixed(4)}
              </span>
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="text-red-500 hover:text-red-700 text-sm"
            >
              Ta bort
            </button>
          </div>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {isExpanded ? 'Dölj karta' : 'Ändra på karta'}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="w-full px-3 py-2 border border-gray-300 border-dashed rounded-md text-sm text-gray-500 hover:border-green-500 hover:text-green-600"
        >
          + Lägg till plats på karta
        </button>
      )}

      {isExpanded && (
        <>
          <div ref={searchRef} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
              placeholder="Sök plats..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-sm"
            />
            {isSearching && (
              <div className="absolute right-3 top-2.5 text-gray-400 text-sm">...</div>
            )}
            {showResults && searchResults.length > 0 && (
              <ul className="absolute mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-sm ring-1 ring-black ring-opacity-5 overflow-auto" style={{ zIndex: 10000 }}>
                {searchResults.map((result) => (
                  <li
                    key={result.place_id}
                    onClick={() => handleSelectResult(result)}
                    className="cursor-pointer select-none py-2 px-3 hover:bg-green-50"
                  >
                    {result.display_name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-lg overflow-hidden border border-gray-300" style={{ height: '300px' }}>
            <MapContainer
              center={center}
              zoom={zoom}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapClickHandler onLocationSelect={handleLocationSelect} />
              <MapUpdater center={center} zoom={value ? 10 : 4} />
              {value && <Marker position={[value.lat, value.lng]} />}
            </MapContainer>
          </div>
        </>
      )}

      {isExpanded && !value && (
        <p className="text-xs text-gray-500">Sök efter en plats eller klicka på kartan</p>
      )}
    </div>
  );
}
