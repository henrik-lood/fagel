import type { FormEvent } from 'react';
import { useState } from 'react';
import { useCustomFields } from '../../hooks/useCustomFields';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Modal } from '../ui/Modal';
import type { CustomFieldType } from '../../types';

export function CustomFieldsManager() {
  const { customFields, addCustomField, deleteCustomField } = useCustomFields();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<CustomFieldType>('text');
  const [options, setOptions] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Ange ett namn för fältet');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await addCustomField({
        name: name.trim(),
        type,
        options: type === 'select' ? options.split(',').map((o) => o.trim()).filter(Boolean) : undefined,
      });
      setName('');
      setType('text');
      setOptions('');
      setIsModalOpen(false);
    } catch {
      setError('Kunde inte skapa fältet');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Är du säker på att du vill ta bort detta fält?')) {
      await deleteCustomField(id);
    }
  };

  const typeLabels: Record<CustomFieldType, string> = {
    text: 'Text',
    number: 'Nummer',
    boolean: 'Ja/Nej',
    select: 'Flerval',
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Egna fält</h3>
        <Button size="sm" onClick={() => setIsModalOpen(true)}>
          Lägg till fält
        </Button>
      </div>

      {customFields.length === 0 ? (
        <p className="text-gray-500 text-sm">
          Du har inga egna fält ännu. Skapa ett för att lägga till extra information till dina observationer.
        </p>
      ) : (
        <div className="space-y-2">
          {customFields.map((field) => (
            <div
              key={field.id}
              className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
            >
              <div>
                <span className="font-medium text-gray-900">{field.name}</span>
                <span className="ml-2 text-sm text-gray-500">
                  ({typeLabels[field.type]})
                </span>
                {field.type === 'select' && field.options && (
                  <span className="ml-2 text-xs text-gray-400">
                    [{field.options.join(', ')}]
                  </span>
                )}
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDelete(field.id)}
              >
                Ta bort
              </Button>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Lägg till eget fält"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <Input
            label="Fältnamn"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="t.ex. Antal individer"
          />

          <Select
            label="Typ"
            value={type}
            onChange={(e) => setType(e.target.value as CustomFieldType)}
            options={[
              { value: 'text', label: 'Text - Fri text' },
              { value: 'number', label: 'Nummer - Endast siffror' },
              { value: 'boolean', label: 'Ja/Nej - Kryssruta' },
              { value: 'select', label: 'Flerval - Välj från lista' },
            ]}
          />

          {type === 'select' && (
            <Input
              label="Alternativ (kommaseparerade)"
              value={options}
              onChange={(e) => setOptions(e.target.value)}
              placeholder="t.ex. Hane, Hona, Okänt"
            />
          )}

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Avbryt
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Skapar...' : 'Skapa fält'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
