import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Lock, ArrowLeft } from "lucide-react";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError("Email ou mot de passe incorrect");
      setLoading(false);
      return;
    }

    // Check admin role
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Erreur d'authentification");
      setLoading(false);
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin");

    if (!roles || roles.length === 0) {
      setError("Vous n'avez pas les droits administrateur");
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    navigate("/admin");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <a href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8 font-body transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour au site
        </a>

        <h1 className="text-3xl font-display font-bold text-gradient-dark mb-2">Administration</h1>
        <p className="text-sm text-muted-foreground font-body mb-8">Connectez-vous pour gérer votre catalogue.</p>

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm font-body p-3 rounded-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full bg-muted border border-border rounded-sm pl-10 pr-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              required
              className="w-full bg-muted border border-border rounded-sm pl-10 pr-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-foreground text-background font-body font-semibold rounded-sm tracking-wide uppercase text-sm hover:opacity-85 transition-all duration-300 disabled:opacity-50"
          >
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
