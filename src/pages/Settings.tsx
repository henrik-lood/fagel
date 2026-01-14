import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export function Settings() {
  const { user, changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 6) {
      setError('Nytt lösenord måste vara minst 6 tecken');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Lösenorden matchar inte');
      return;
    }

    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setSuccess('Lösenordet har ändrats');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kunde inte ändra lösenord';
      if (message.includes('wrong-password') || message.includes('invalid-credential')) {
        setError('Nuvarande lösenord är felaktigt');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Inställningar</h1>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Konto</h2>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500">Namn:</span>{' '}
                <span className="text-gray-900">{user?.displayName || '-'}</span>
              </div>
              <div>
                <span className="text-gray-500">E-post:</span>{' '}
                <span className="text-gray-900">{user?.email}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Byt lösenord</h2>

            {error && (
              <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded text-sm">
                {success}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <Input
                label="Nuvarande lösenord"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
              <Input
                label="Nytt lösenord"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <Input
                label="Bekräfta nytt lösenord"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <Button type="submit" disabled={loading}>
                {loading ? 'Ändrar...' : 'Byt lösenord'}
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
