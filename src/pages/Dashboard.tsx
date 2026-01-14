import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useObservations } from "../hooks/useObservations";
import { ObservationList } from "../components/observations/ObservationList";
import { Button } from "../components/ui/Button";

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
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center gap-2">
          <div className="min-w-0 flex-1">
            <Link
              to="/"
              className="text-lg sm:text-xl font-bold text-green-600"
            >
              Fågelskådarlistan
            </Link>
            <span className="hidden md:inline ml-4 text-gray-500 text-sm">
              Välkommen, {user?.displayName || user?.email}
            </span>
          </div>
          <div className="flex gap-1 sm:gap-2 flex-shrink-0">
            <Link to="/settings">
              <Button variant="secondary" size="sm">
                <span className="hidden sm:inline">Inställningar</span>
                <span className="sm:hidden">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </span>
              </Button>
            </Link>
            <Button variant="secondary" size="sm" onClick={logout}>
              <span className="hidden sm:inline">Logga ut</span>
              <span className="sm:hidden">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-3xl font-bold text-green-600">
              {stats.totalSpecies}
            </div>
            <div className="text-sm text-gray-500">Arter totalt</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-green-600">
              {stats.seenSwe}
            </div>
            <div className="text-xs text-gray-500">Sedda i Sverige</div>
            <div className="text-lg font-bold text-green-700 mt-1">
              {stats.seenInt}
            </div>
            <div className="text-xs text-gray-500">Sedda utomlands</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-blue-600">
              {stats.heardSwe}
            </div>
            <div className="text-xs text-gray-500">Hörda i Sverige</div>
            <div className="text-lg font-bold text-blue-700 mt-1">
              {stats.heardInt}
            </div>
            <div className="text-xs text-gray-500">Hörda utomlands</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-purple-600">
              {stats.ringedSwe}
            </div>
            <div className="text-xs text-gray-500">Ringmärkta i Sverige</div>
            <div className="text-lg font-bold text-purple-700 mt-1">
              {stats.ringedInt}
            </div>
            <div className="text-xs text-gray-500">Ringmärkta utomlands</div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Mina observationer
          </h2>
          <Link to="/add">
            <Button>Lägg till observation</Button>
          </Link>
        </div>

        <ObservationList />
      </main>
    </div>
  );
}
