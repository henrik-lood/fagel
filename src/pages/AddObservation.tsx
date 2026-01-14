import { useNavigate, Link } from 'react-router-dom';
import { ObservationForm } from '../components/observations/ObservationForm';
import { Button } from '../components/ui/Button';

export function AddObservation() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-2xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/dashboard" className="text-xl font-bold text-green-600">
            Fågelskådarlistan
          </Link>
          <Link to="/dashboard">
            <Button variant="secondary" size="sm">
              Tillbaka
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Lägg till observation
          </h1>
          <ObservationForm onSuccess={() => navigate('/dashboard')} />
        </div>
      </main>
    </div>
  );
}
