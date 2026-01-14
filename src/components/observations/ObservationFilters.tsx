import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

export type FilterType = 'all' | 'seenSwe' | 'seenInt' | 'heardSwe' | 'heardInt' | 'ringedSwe' | 'ringedInt';

interface ObservationFiltersProps {
  typeFilter: FilterType;
  onTypeFilterChange: (value: FilterType) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function ObservationFilters({
  typeFilter,
  onTypeFilterChange,
  searchTerm,
  onSearchChange,
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
            { value: 'all', label: 'Alla observationer' },
            { value: 'seenSwe', label: 'Sedd i Sverige' },
            { value: 'seenInt', label: 'Sedd utomlands' },
            { value: 'heardSwe', label: 'Hörd i Sverige' },
            { value: 'heardInt', label: 'Hörd utomlands' },
            { value: 'ringedSwe', label: 'Ringmärkt i Sverige' },
            { value: 'ringedInt', label: 'Ringmärkt utomlands' },
          ]}
        />
      </div>
    </div>
  );
}
