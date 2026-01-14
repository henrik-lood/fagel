import { Input } from "../ui/Input";
import { Select } from "../ui/Select";

export type FilterType =
  | "all"
  | "seenSwe"
  | "seenInt"
  | "heardSwe"
  | "heardInt"
  | "ringedSwe"
  | "ringedInt";

interface ObservationFiltersProps {
  typeFilter: FilterType;
  onTypeFilterChange: (value: FilterType) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  showAllSpecies: boolean;
  onShowAllSpeciesChange: (value: boolean) => void;
}

export function ObservationFilters({
  typeFilter,
  onTypeFilterChange,
  searchTerm,
  onSearchChange,
  showAllSpecies,
  onShowAllSpeciesChange,
}: ObservationFiltersProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          placeholder="Sök art..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <Select
          value={typeFilter}
          onChange={(e) => onTypeFilterChange(e.target.value as FilterType)}
          options={[
            { value: "all", label: "Alla observationer" },
            { value: "seenSwe", label: "Sedd i Sverige" },
            { value: "seenInt", label: "Sedd utomlands" },
            { value: "heardSwe", label: "Hörd i Sverige" },
            { value: "heardInt", label: "Hörd utomlands" },
            { value: "ringedSwe", label: "Ringmärkt i Sverige" },
            { value: "ringedInt", label: "Ringmärkt utomlands" },
          ]}
        />
      </div>
      <div className="mt-4 flex items-center">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={showAllSpecies}
            onChange={(e) => onShowAllSpeciesChange(e.target.checked)}
            className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
          />
          <span className="ml-2 text-sm text-gray-700">
            Visa alla tillgängliga arter (även de jag inte observerat)
          </span>
        </label>
      </div>
    </div>
  );
}
