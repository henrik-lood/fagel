import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { LocationPicker } from '../ui/LocationPicker';
import type { BirdObservation, BirdSpecies, ObservationLocation } from '../../types';

interface EditObservationModalProps {
  observation: BirdObservation;
  species?: BirdSpecies;
  onUpdate: (birdId: string, updates: Partial<BirdObservation>) => Promise<void>;
  onClose: () => void;
}

export function EditObservationModal({ observation, species, onUpdate, onClose }: EditObservationModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [seenSwe, setSeenSwe] = useState(observation.seenSwe || false);
  const [seenInt, setSeenInt] = useState(observation.seenInt || false);
  const [heardSwe, setHeardSwe] = useState(observation.heardSwe || false);
  const [heardInt, setHeardInt] = useState(observation.heardInt || false);
  const [ringedSwe, setRingedSwe] = useState(observation.ringedSwe || false);
  const [ringedInt, setRingedInt] = useState(observation.ringedInt || false);
  const [date, setDate] = useState(observation.date || '');
  const [comment, setComment] = useState(observation.comment || '');
  const [location, setLocation] = useState<ObservationLocation | null>(observation.location || null);

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!seenSwe && !seenInt && !heardSwe && !heardInt && !ringedSwe && !ringedInt) {
      setError('Välj minst ett alternativ');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const updates: BirdObservation = {
        birdId: observation.birdId,
      };

      if (seenSwe) updates.seenSwe = true;
      if (seenInt) updates.seenInt = true;
      if (heardSwe) updates.heardSwe = true;
      if (heardInt) updates.heardInt = true;
      if (ringedSwe) updates.ringedSwe = true;
      if (ringedInt) updates.ringedInt = true;
      if (date) updates.date = date;
      if (comment.trim()) updates.comment = comment.trim();
      if (location) updates.location = location;

      await onUpdate(observation.birdId, updates);
      onClose();
    } catch (err) {
      console.error('Update error:', err);
      setError('Kunde inte uppdatera observationen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Redigera observation">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
            {error}
          </div>
        )}

        <div className="bg-gray-50 rounded-lg p-3">
          <div className="font-medium text-gray-900">
            {species ? capitalize(species.name) : 'Okänd art'}
          </div>
          {species && (
            <div className="text-sm text-gray-500 italic">{capitalize(species.latinName)}</div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Sverige</h4>
            <div className="space-y-2">
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
            <h4 className="text-sm font-medium text-gray-700 mb-2">Utomlands</h4>
            <div className="space-y-2">
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
          label="Datum"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Kommentar
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-sm"
            placeholder="T.ex. antal, väder..."
          />
        </div>

        <LocationPicker
          label="Plats"
          value={location}
          onChange={setLocation}
        />

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Avbryt
          </Button>
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? 'Sparar...' : 'Spara'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
