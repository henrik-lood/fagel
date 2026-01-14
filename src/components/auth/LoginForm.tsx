import type { FormEvent } from 'react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const { login, resetPassword } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch {
      setError('Fel e-post eller lösenord');
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) {
      setError('Ange din e-postadress');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      setSuccess('Ett e-postmeddelande har skickats med instruktioner för att återställa ditt lösenord');
    } catch {
      setError('Kunde inte skicka återställningsmail. Kontrollera e-postadressen.');
    } finally {
      setLoading(false);
    }
  }

  if (showResetForm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Återställ lösenord
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Ange din e-postadress så skickar vi instruktioner
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded text-sm">
                {success}
              </div>
            )}
            <div>
              <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700">
                E-post
              </label>
              <input
                id="reset-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {loading ? 'Skickar...' : 'Skicka återställningsmail'}
            </button>
            <p className="text-center text-sm text-gray-600">
              <button
                type="button"
                onClick={() => {
                  setShowResetForm(false);
                  setError('');
                  setSuccess('');
                }}
                className="font-medium text-green-600 hover:text-green-500"
              >
                Tillbaka till inloggning
              </button>
            </p>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Logga in
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                E-post
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Lösenord
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                setShowResetForm(true);
                setError('');
              }}
              className="text-sm text-green-600 hover:text-green-500"
            >
              Glömt lösenord?
            </button>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            {loading ? 'Loggar in...' : 'Logga in'}
          </button>
          <p className="text-center text-sm text-gray-600">
            Har du inget konto?{' '}
            <Link to="/register" className="font-medium text-green-600 hover:text-green-500">
              Registrera dig
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
