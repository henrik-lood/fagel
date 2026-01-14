import { useState, useMemo } from "react";
import { useObservations } from "../../hooks/useObservations";
import { useSpecies } from "../../hooks/useSpecies";
import { ObservationCard } from "./ObservationCard";
import { ObservationFilters, type FilterType } from "./ObservationFilters";
import { EditObservationModal } from "./EditObservationModal";
import { ImageModal } from "../ui/ImageModal";
import type { BirdObservation } from "../../types";

export function ObservationList() {
  const {
    observations,
    loading: obsLoading,
    updateObservation,
    deleteObservation,
  } = useObservations();
  const { species, getSpeciesMap, loading: speciesLoading } = useSpecies();
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAllSpecies, setShowAllSpecies] = useState(false);
  const [editingObservation, setEditingObservation] =
    useState<BirdObservation | null>(null);
  const [imageModal, setImageModal] = useState<{
    url: string;
    alt: string;
  } | null>(null);

  const loading = obsLoading || speciesLoading;

  const filteredObservations = useMemo(() => {
    return observations.filter((obs) => {
      // Filter by type
      if (typeFilter !== "all") {
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
      return speciesA.name.localeCompare(speciesB.name, "sv");
    });
  }, [filteredObservations, getSpeciesMap]);

  // Get list to display based on toggle
  const displayItems = useMemo(() => {
    if (showAllSpecies) {
      // Show all species with search filter
      return species
        .filter((s) => {
          if (!searchTerm) return true;
          const term = searchTerm.toLowerCase();
          return (
            s.name.toLowerCase().includes(term) ||
            s.latinName.toLowerCase().includes(term)
          );
        })
        .map((s) => ({
          type: "species" as const,
          species: s,
          observation: observations.find((o) => o.birdId === s.id),
        }));
    } else {
      // Show only observations
      return sortedObservations.map((obs) => ({
        type: "observation" as const,
        observation: obs,
        species: getSpeciesMap.get(obs.birdId),
      }));
    }
  }, [
    showAllSpecies,
    species,
    searchTerm,
    observations,
    sortedObservations,
    getSpeciesMap,
  ]);

  const handleEdit = (birdId: string) => {
    const observation = observations.find((o) => o.birdId === birdId);
    if (observation) {
      setEditingObservation(observation);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500">
        Laddar observationer...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ObservationFilters
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        showAllSpecies={showAllSpecies}
        onShowAllSpeciesChange={setShowAllSpecies}
      />

      <div className="text-sm text-gray-500">
        {showAllSpecies
          ? `Visar ${displayItems.length} arter`
          : `Visar ${sortedObservations.length} av ${observations.length} observationer`}
      </div>

      {displayItems.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {showAllSpecies
            ? "Inga arter matchar din sökning."
            : observations.length === 0
            ? "Inga observationer ännu. Lägg till din första!"
            : "Inga observationer matchar dina filter."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayItems.map((item) => {
            const observation = item.observation || {
              birdId: item.species!.id,
              seenSwe: false,
              seenInt: false,
              heardSwe: false,
              heardInt: false,
              ringedSwe: false,
              ringedInt: false,
            };
            return (
              <ObservationCard
                key={item.species?.id || observation.birdId}
                observation={observation}
                species={item.species}
                onEdit={item.observation ? handleEdit : undefined}
                onDelete={item.observation ? deleteObservation : undefined}
                onImageClick={(url, alt) => setImageModal({ url, alt })}
              />
            );
          })}
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

      {imageModal && (
        <ImageModal
          imageUrl={imageModal.url}
          altText={imageModal.alt}
          onClose={() => setImageModal(null)}
        />
      )}
    </div>
  );
}
