import type { BirdObservation, BirdSpecies } from '../../types';
import { Button } from '../ui/Button';
import { useBirdImage } from '../../hooks/useBirdImage';

interface ObservationCardProps {
  observation: BirdObservation;
  species?: BirdSpecies;
  onEdit?: (birdId: string) => void;
  onDelete?: (birdId: string) => void;
}

export function ObservationCard({ observation, species, onEdit, onDelete }: ObservationCardProps) {
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const { imageUrl, wikiUrl } = useBirdImage(species?.latinName, species?.name);

  const Checkbox = ({ checked }: { checked?: boolean }) => (
    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
      checked
        ? 'bg-green-500 border-green-500'
        : 'border-gray-300 bg-white'
    }`}>
      {checked && (
        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
      <div className="flex gap-3 mb-3">
        {/* Bird image thumbnail */}
        <div className="flex-shrink-0">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={species?.name || 'Bird'}
              className="w-16 h-16 rounded-lg object-cover bg-gray-100"
              loading="lazy"
            />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        {/* Bird name */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {species ? capitalize(species.name) : 'Okänd art'}
          </h3>
          {species ? (
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-500 italic">{capitalize(species.latinName)}</p>
              {wikiUrl && (
                <a
                  href={wikiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-700"
                  title="Läs mer på Wikipedia"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
          ) : (
            <p className="text-sm text-red-400">ID: {observation.birdId}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="font-medium text-gray-700 mb-2">Sverige</div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Checkbox checked={observation.seenSwe} />
              <span className="text-gray-600">Sedd</span>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={observation.heardSwe} />
              <span className="text-gray-600">Hörd</span>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={observation.ringedSwe} />
              <span className="text-gray-600">Ringmärkt</span>
            </div>
          </div>
        </div>
        <div>
          <div className="font-medium text-gray-700 mb-2">Utomlands</div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Checkbox checked={observation.seenInt} />
              <span className="text-gray-600">Sedd</span>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={observation.heardInt} />
              <span className="text-gray-600">Hörd</span>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={observation.ringedInt} />
              <span className="text-gray-600">Ringmärkt</span>
            </div>
          </div>
        </div>
      </div>

      {(observation.date || observation.comment || observation.location) && (
        <div className="mt-3 pt-3 border-t border-gray-100 text-sm">
          {observation.location && (
            <p className="text-gray-500 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {observation.location.name || `${observation.location.lat.toFixed(2)}, ${observation.location.lng.toFixed(2)}`}
            </p>
          )}
          {observation.date && (
            <p className="text-gray-500">Datum: {observation.date}</p>
          )}
          {observation.comment && (
            <p className="text-gray-600 mt-1">{observation.comment}</p>
          )}
        </div>
      )}

      {/* Action buttons at bottom */}
      {(onEdit || onDelete) && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2 justify-end">
          {onEdit && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onEdit(observation.birdId)}
            >
              Redigera
            </Button>
          )}
          {onDelete && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => onDelete(observation.birdId)}
            >
              Ta bort
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
