import { useState, useMemo } from 'react';
import { useObservations } from '../../hooks/useObservations';
import { useSpecies } from '../../hooks/useSpecies';
import { ObservationCard } from './ObservationCard';
import { ObservationFilters, type FilterType } from './ObservationFilters';
import { EditObservationModal } from './EditObservationModal';
import type { BirdObservation } from '../../types';

export function ObservationList() {
  const { observations, loading: obsLoading, updateObservation, deleteObservation } = useObservations();
  const { getSpeciesMap, loading: speciesLoading } = useSpecies();
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingObservation, setEditingObservation] = useState<BirdObservation | null>(null);

  const loading = obsLoading || speciesLoading;

  const filteredObservations = useMemo(() => {
    return observations.filter((obs) => {
      // Filter by type
      if (typeFilter !== 'all') {
        if (!obs[typeFilter]) return false;
      }

      // Filter by search term (species name)
      if (searchTerm) {
        const species = getSpeciesMap.get(obs.birdId);
        if (!species) return false;
        const term = searchTerm.toLowerCase();
        return (
          species.name.toLowerCase().includes(term) ||
          species.latinName.toLowerCase().includes(term)
        );
      }

      return true;
    });
  }, [observations, typeFilter, searchTerm, getSpeciesMap]);

  // Sort by species name
  const sortedObservations = useMemo(() => {
    return [...filteredObservations].sort((a, b) => {
      const speciesA = getSpeciesMap.get(a.birdId);
      const speciesB = getSpeciesMap.get(b.birdId);
      if (!speciesA || !speciesB) return 0;
      return speciesA.name.localeCompare(speciesB.name, 'sv');
    });
  }, [filteredObservations, getSpeciesMap]);

  const handleEdit = (birdId: string) => {
    const observation = observations.find((o) => o.birdId === birdId);
    if (observation) {
      setEditingObservation(observation);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Laddar observationer...</div>;
  }

  return (
    <div className="space-y-4">
      <ObservationFilters
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <div className="text-sm text-gray-500">
        Visar {sortedObservations.length} av {observations.length} observationer
      </div>

      {sortedObservations.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {observations.length === 0
            ? 'Inga observationer ännu. Lägg till din första!'
            : 'Inga observationer matchar dina filter.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedObservations.map((observation) => (
            <ObservationCard
              key={observation.birdId}
              observation={observation}
              species={getSpeciesMap.get(observation.birdId)}
              onEdit={handleEdit}
              onDelete={deleteObservation}
            />
          ))}
        </div>
      )}

      {editingObservation && (
        <EditObservationModal
          observation={editingObservation}
          species={getSpeciesMap.get(editingObservation.birdId)}
          onUpdate={updateObservation}
          onClose={() => setEditingObservation(null)}
        />
      )}
    </div>
  );
}
