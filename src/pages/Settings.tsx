import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useSpecies } from "../hooks/useSpecies";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

export function Settings() {
  const { user, changePassword } = useAuth();
  const { userSpecies, updateSpecies, deleteSpecies } = useSpecies();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingBird, setEditingBird] = useState<{
    id: string;
    name: string;
    latinName: string;
  } | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword.length < 6) {
      setError("Nytt lösenord måste vara minst 6 tecken");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Lösenorden matchar inte");
      return;
    }

    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setSuccess("Lösenordet har ändrats");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Kunde inte ändra lösenord";
      if (
        message.includes("wrong-password") ||
        message.includes("invalid-credential")
      ) {
        setError("Nuvarande lösenord är felaktigt");
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBird = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBird) return;

    try {
      await updateSpecies(
        editingBird.id,
        editingBird.name,
        editingBird.latinName
      );
      setEditingBird(null);
      setSuccess("Fågel uppdaterad");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Kunde inte uppdatera fågel"
      );
    }
  };

  const handleDeleteBird = async (id: string) => {
    if (!confirm("Är du säker på att du vill ta bort denna fågel?")) return;

    try {
      await deleteSpecies(id);
      setSuccess("Fågel borttagen");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte ta bort fågel");
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
                <span className="text-gray-500">Namn:</span>{" "}
                <span className="text-gray-900">
                  {user?.displayName || "-"}
                </span>
              </div>
              <div>
                <span className="text-gray-500">E-post:</span>{" "}
                <span className="text-gray-900">{user?.email}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Mina egna fåglar
            </h2>

            {userSpecies.length === 0 ? (
              <p className="text-sm text-gray-500">
                Du har inga egna fåglar tillagda ännu.
              </p>
            ) : (
              <div className="space-y-2">
                {userSpecies.map((bird) => (
                  <div
                    key={bird.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded"
                  >
                    {editingBird?.id === bird.id ? (
                      <form
                        onSubmit={handleUpdateBird}
                        className="flex-1 flex gap-2"
                      >
                        <Input
                          value={editingBird.name}
                          onChange={(e) =>
                            setEditingBird({
                              ...editingBird,
                              name: e.target.value,
                            })
                          }
                          placeholder="Svenskt namn"
                          className="flex-1"
                        />
                        <Input
                          value={editingBird.latinName}
                          onChange={(e) =>
                            setEditingBird({
                              ...editingBird,
                              latinName: e.target.value,
                            })
                          }
                          placeholder="Latinskt namn"
                          className="flex-1"
                        />
                        <Button type="submit" size="sm">
                          Spara
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => setEditingBird(null)}
                        >
                          Avbryt
                        </Button>
                      </form>
                    ) : (
                      <>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 capitalize">
                            {bird.name}
                          </p>
                          <p className="text-sm text-gray-500 italic capitalize">
                            {bird.latinName}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingBird(bird)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                            title="Redigera"
                            aria-label="Redigera"
                          >
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
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteBird(bird.id)}
                            className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                            title="Ta bort"
                            aria-label="Ta bort"
                          >
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
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Byt lösenord
            </h2>

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
                {loading ? "Ändrar..." : "Byt lösenord"}
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
