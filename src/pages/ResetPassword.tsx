import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Lock, ArrowLeft, CheckCircle } from "lucide-react";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    // Also check URL hash for type=recovery
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError("Erreur lors de la mise à jour du mot de passe. Veuillez réessayer.");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);

    // Sign out and redirect to login after 3 seconds
    setTimeout(async () => {
      await supabase.auth.signOut();
      navigate("/admin/login");
    }, 3000);
  };

  if (!isRecovery) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-2xl font-display font-bold text-foreground mb-4">Lien invalide</h1>
          <p className="text-sm text-muted-foreground font-body mb-6">
            Ce lien de réinitialisation est invalide ou a expiré.
          </p>
          <a
            href="/admin/login"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground font-body transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Retour à la connexion
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <a
          href="/admin/login"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8 font-body transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Retour à la connexion
        </a>

        {success ? (
          <div className="text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-display font-bold text-foreground mb-2">
              Mot de passe modifié
            </h1>
            <p className="text-sm text-muted-foreground font-body">
              Redirection vers la page de connexion…
            </p>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-display font-bold text-gradient-dark mb-2">
              Nouveau mot de passe
            </h1>
            <p className="text-sm text-muted-foreground font-body mb-8">
              Définissez votre nouveau mot de passe.
            </p>

            {error && (
              <div className="bg-destructive/10 text-destructive text-sm font-body p-3 rounded-sm mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleReset} className="space-y-4">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nouveau mot de passe"
                  required
                  className="w-full bg-muted border border-border rounded-sm pl-10 pr-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirmer le mot de passe"
                  required
                  className="w-full bg-muted border border-border rounded-sm pl-10 pr-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-foreground text-background font-body font-semibold rounded-sm tracking-wide uppercase text-sm hover:opacity-85 transition-all duration-300 disabled:opacity-50"
              >
                {loading ? "Mise à jour…" : "Mettre à jour"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
