import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';

export function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
            Fågelskådarlistan
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Håll koll på alla fåglar du sett, hört eller ringmärkt - i Sverige och utomlands.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            {user ? (
              <Link to="/dashboard">
                <Button size="lg">Gå till mina observationer</Button>
              </Link>
            ) : (
              <>
                <Link to="/register">
                  <Button size="lg">Kom igång</Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="secondary">
                    Logga in
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Registrera observationer</h3>
            <p className="mt-2 text-gray-600">
              Logga fåglar du sett, hört eller ringmärkt med datum och plats.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Sverige och utomlands</h3>
            <p className="mt-2 text-gray-600">
              Spåra dina observationer oavsett om du är i Sverige eller på resa.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Egna fält</h3>
            <p className="mt-2 text-gray-600">
              Lägg till egna datafält för att spara precis den information du vill.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
