import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useObservations } from '../hooks/useObservations';
import { ObservationList } from '../components/observations/ObservationList';
import { Button } from '../components/ui/Button';

export function Dashboard() {
  const { user, logout } = useAuth();
  const { observations } = useObservations();

  const stats = useMemo(() => {
    const seenSwe = observations.filter((o) => o.seenSwe).length;
    const seenInt = observations.filter((o) => o.seenInt).length;
    const heardSwe = observations.filter((o) => o.heardSwe).length;
    const heardInt = observations.filter((o) => o.heardInt).length;
    const ringedSwe = observations.filter((o) => o.ringedSwe).length;
    const ringedInt = observations.filter((o) => o.ringedInt).length;

    return {
      totalSpecies: observations.length,
      seenSwe,
      seenInt,
      heardSwe,
      heardInt,
      ringedSwe,
      ringedInt,
    };
  }, [observations]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <Link to="/" className="text-xl font-bold text-green-600">
              Fågelskådarlistan
            </Link>
            <span className="ml-4 text-gray-500">
              Välkommen, {user?.displayName || user?.email}
            </span>
          </div>
          <div className="flex gap-2">
            <Link to="/settings">
              <Button variant="secondary" size="sm">
                Inställningar
              </Button>
            </Link>
            <Button variant="secondary" size="sm" onClick={logout}>
              Logga ut
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-3xl font-bold text-green-600">{stats.totalSpecies}</div>
            <div className="text-sm text-gray-500">Arter totalt</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-green-600">{stats.seenSwe}</div>
            <div className="text-xs text-gray-500">Sedda i Sverige</div>
            <div className="text-lg font-bold text-green-700 mt-1">{stats.seenInt}</div>
            <div className="text-xs text-gray-500">Sedda utomlands</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.heardSwe}</div>
            <div className="text-xs text-gray-500">Hörda i Sverige</div>
            <div className="text-lg font-bold text-blue-700 mt-1">{stats.heardInt}</div>
            <div className="text-xs text-gray-500">Hörda utomlands</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.ringedSwe}</div>
            <div className="text-xs text-gray-500">Ringmärkta i Sverige</div>
            <div className="text-lg font-bold text-purple-700 mt-1">{stats.ringedInt}</div>
            <div className="text-xs text-gray-500">Ringmärkta utomlands</div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Mina observationer</h2>
          <Link to="/add">
            <Button>Lägg till observation</Button>
          </Link>
        </div>

        <ObservationList />
      </main>
    </div>
  );
}
