import type { FormEvent } from 'react';
import { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { LocationPicker } from '../ui/LocationPicker';
import { SpeciesSearch } from '../species/SpeciesSearch';
import { useObservations } from '../../hooks/useObservations';
import type { BirdSpecies, BirdObservation, ObservationLocation } from '../../types';

interface ObservationFormProps {
  onSuccess?: () => void;
  existingObservation?: BirdObservation;
  existingSpecies?: BirdSpecies;
}

export function ObservationForm({ onSuccess, existingObservation, existingSpecies }: ObservationFormProps) {
  const { addObservation } = useObservations();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [species, setSpecies] = useState<BirdSpecies | null>(existingSpecies || null);
  const [seenSwe, setSeenSwe] = useState(existingObservation?.seenSwe || false);
  const [seenInt, setSeenInt] = useState(existingObservation?.seenInt || false);
  const [heardSwe, setHeardSwe] = useState(existingObservation?.heardSwe || false);
  const [heardInt, setHeardInt] = useState(existingObservation?.heardInt || false);
  const [ringedSwe, setRingedSwe] = useState(existingObservation?.ringedSwe || false);
  const [ringedInt, setRingedInt] = useState(existingObservation?.ringedInt || false);
  const [date, setDate] = useState(existingObservation?.date || '');
  const [comment, setComment] = useState(existingObservation?.comment || '');
  const [location, setLocation] = useState<ObservationLocation | null>(existingObservation?.location || null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!species) {
      setError('Välj en fågelart');
      return;
    }

    if (!seenSwe && !seenInt && !heardSwe && !heardInt && !ringedSwe && !ringedInt) {
      setError('Välj minst ett alternativ (sedd/hörd/ringmärkt)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const observation: BirdObservation = {
        birdId: species.id,
      };

      if (seenSwe) observation.seenSwe = true;
      if (seenInt) observation.seenInt = true;
      if (heardSwe) observation.heardSwe = true;
      if (heardInt) observation.heardInt = true;
      if (ringedSwe) observation.ringedSwe = true;
      if (ringedInt) observation.ringedInt = true;
      if (date) observation.date = date;
      if (comment.trim()) observation.comment = comment.trim();
      if (location) observation.location = location;

      await addObservation(observation);

      // Reset form
      setSpecies(null);
      setSeenSwe(false);
      setSeenInt(false);
      setHeardSwe(false);
      setHeardInt(false);
      setRingedSwe(false);
      setRingedInt(false);
      setDate('');
      setComment('');
      setLocation(null);

      onSuccess?.();
    } catch {
      setError('Kunde inte spara observationen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <SpeciesSearch
        label="Fågelart"
        value={species}
        onChange={setSpecies}
      />

      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">I Sverige</h4>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={seenSwe}
                onChange={(e) => setSeenSwe(e.target.checked)}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="ml-2 text-sm text-gray-700">Sedd</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={heardSwe}
                onChange={(e) => setHeardSwe(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Hörd</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={ringedSwe}
                onChange={(e) => setRingedSwe(e.target.checked)}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="ml-2 text-sm text-gray-700">Ringmärkt</span>
            </label>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Utomlands</h4>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={seenInt}
                onChange={(e) => setSeenInt(e.target.checked)}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="ml-2 text-sm text-gray-700">Sedd</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={heardInt}
                onChange={(e) => setHeardInt(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Hörd</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={ringedInt}
                onChange={(e) => setRingedInt(e.target.checked)}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="ml-2 text-sm text-gray-700">Ringmärkt</span>
            </label>
          </div>
        </div>
      </div>

      <Input
        label="Datum (valfritt)"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Kommentar (valfritt)
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
          placeholder="T.ex. antal, väder..."
        />
      </div>

      <LocationPicker
        label="Plats (valfritt)"
        value={location}
        onChange={setLocation}
      />

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Sparar...' : 'Lägg till observation'}
      </Button>
    </form>
  );
}
