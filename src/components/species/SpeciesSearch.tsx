import { useState, useRef, useEffect } from 'react';
import { useSpecies } from '../../hooks/useSpecies';
import { useBirdLookup } from '../../hooks/useBirdLookup';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import type { BirdSpecies } from '../../types';

interface SpeciesSearchProps {
  value: BirdSpecies | null;
  onChange: (species: BirdSpecies | null) => void;
  label?: string;
  error?: string;
}

export function SpeciesSearch({ value, onChange, label, error }: SpeciesSearchProps) {
  const { filteredSpecies, searchTerm, setSearchTerm, addSpecies, loading } = useSpecies();
  const { lookupBird, loading: lookupLoading } = useBirdLookup();
  const [isOpen, setIsOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLatinName, setNewLatinName] = useState('');
  const [addingBird, setAddingBird] = useState(false);
  const [lookupStatus, setLookupStatus] = useState<string>('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (species: BirdSpecies) => {
    onChange(species);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
    if (!e.target.value) {
      onChange(null);
    }
  };

  const handleOpenAddModal = async () => {
    setNewName(searchTerm);
    setNewLatinName('');
    setLookupStatus('');
    setShowAddModal(true);
    setIsOpen(false);

    // Try to look up automatically
    setLookupStatus('Söker...');
    const result = await lookupBird(searchTerm);
    if (result) {
      if (result.latinName) {
        setNewLatinName(result.latinName);
      }
      if (result.swedishName && result.swedishName !== searchTerm.toLowerCase()) {
        // Only update Swedish name if lookup found something different
        // (e.g., user entered Latin name)
        setNewName(result.swedishName);
      }
      setLookupStatus(result.latinName || result.swedishName ? 'Hittade information!' : '');
    } else {
      setLookupStatus('');
    }
  };

  // Validate that a name looks like a Latin species name (Genus species)
  const isValidLatinName = (name: string) => {
    return /^[a-z]+ [a-z]+/i.test(name.trim()) && !name.includes('å') && !name.includes('ä') && !name.includes('ö');
  };

  const handleLookupFromSwedish = async () => {
    const term = newName.trim();
    if (!term) return;

    setLookupStatus('Söker latinskt namn...');
    const result = await lookupBird(term);
    if (result?.latinName && isValidLatinName(result.latinName)) {
      setNewLatinName(result.latinName);
      setLookupStatus('Hittade latinskt namn!');
    } else {
      setLookupStatus('Kunde inte hitta latinskt namn');
    }
  };

  const handleLookupFromLatin = async () => {
    const term = newLatinName.trim();
    if (!term) return;

    setLookupStatus('Söker svenskt namn...');
    const result = await lookupBird(term);
    // Make sure we got a different name back (not the same as input)
    if (result?.swedishName && result.swedishName.toLowerCase() !== term.toLowerCase()) {
      setNewName(result.swedishName);
      setLookupStatus('Hittade svenskt namn!');
    } else {
      setLookupStatus('Kunde inte hitta svenskt namn');
    }
  };

  const handleAddBird = async () => {
    if (!newName.trim() || !newLatinName.trim()) return;

    setAddingBird(true);
    try {
      const newSpecies = await addSpecies(newName.trim(), newLatinName.trim());
      onChange(newSpecies);
      setSearchTerm('');
      setShowAddModal(false);
      setNewName('');
      setNewLatinName('');
    } catch (err) {
      console.error('Failed to add bird:', err);
    } finally {
      setAddingBird(false);
    }
  };

  // Capitalize first letter for display
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  const displayValue = value
    ? `${capitalize(value.name)} (${capitalize(value.latinName)})`
    : searchTerm;

  const showAddOption = searchTerm.trim().length > 0 && filteredSpecies.length === 0;

  return (
    <>
      <div ref={wrapperRef} className="relative w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <input
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={loading ? 'Laddar arter...' : 'Sök fågelart...'}
          disabled={loading}
          className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 ${
            error ? 'border-red-300' : 'border-gray-300'
          } ${loading ? 'bg-gray-100' : ''}`}
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

        {isOpen && (filteredSpecies.length > 0 || showAddOption) && (
          <ul className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
            {filteredSpecies.slice(0, 50).map((species) => (
              <li
                key={species.id}
                onClick={() => handleSelect(species)}
                className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-green-50"
              >
                <div className="flex flex-col">
                  <span className="font-medium text-gray-900">
                    {capitalize(species.name)}
                  </span>
                  <span className="text-sm text-gray-500 italic">
                    {capitalize(species.latinName)}
                  </span>
                </div>
              </li>
            ))}
            {showAddOption && (
              <li
                onClick={handleOpenAddModal}
                className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-50 border-t border-gray-100"
              >
                <div className="flex items-center gap-2 text-blue-600">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="font-medium">Lägg till "{searchTerm}" som ny art</span>
                </div>
              </li>
            )}
          </ul>
        )}
      </div>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Lägg till ny fågelart">
        <div className="space-y-4">
          {lookupStatus && (
            <div className={`text-sm px-3 py-2 rounded ${
              lookupStatus.includes('Söker')
                ? 'bg-blue-50 text-blue-600'
                : lookupStatus.includes('Hittade')
                  ? 'bg-green-50 text-green-600'
                  : 'bg-yellow-50 text-yellow-600'
            }`}>
              {lookupStatus}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Svenskt namn
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="T.ex. blåfotad sula"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleLookupFromSwedish}
                disabled={lookupLoading || !newName.trim()}
                title="Sök efter latinskt namn"
              >
                {lookupLoading ? '...' : '→ Latin'}
              </Button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Latinskt namn
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newLatinName}
                onChange={(e) => setNewLatinName(e.target.value)}
                placeholder="T.ex. Sula nebouxii"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleLookupFromLatin}
                disabled={lookupLoading || !newLatinName.trim()}
                title="Sök efter svenskt namn"
              >
                {lookupLoading ? '...' : '→ Svenska'}
              </Button>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Ange ett namn och klicka på knappen för att hitta det andra automatiskt.
          </p>
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowAddModal(false)}
              className="flex-1"
            >
              Avbryt
            </Button>
            <Button
              type="button"
              onClick={handleAddBird}
              disabled={addingBird || !newName.trim() || !newLatinName.trim()}
              className="flex-1"
            >
              {addingBird ? 'Lägger till...' : 'Lägg till'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
