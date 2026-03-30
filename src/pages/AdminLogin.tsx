import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Lock, ArrowLeft, ShieldCheck, Smartphone } from "lucide-react";

type MfaStep = "login" | "enroll" | "verify";

const AdminLogin = () => {
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => { document.head.removeChild(meta); };
  }, []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mfaStep, setMfaStep] = useState<MfaStep>("login");
  const [totpCode, setTotpCode] = useState("");
  const [qrUri, setQrUri] = useState("");
  const [factorId, setFactorId] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

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

    // Check MFA status
    const { data: factorsData } = await supabase.auth.mfa.listFactors();
    const totpFactors = factorsData?.totp || [];
    const verifiedFactors = totpFactors.filter(f => f.status === "verified");

    if (verifiedFactors.length > 0) {
      // MFA enrolled - need verification
      const factor = verifiedFactors[0];
      setFactorId(factor.id);
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: factor.id });
      if (challengeError) {
        setError("Erreur lors de la vérification MFA");
        setLoading(false);
        return;
      }
      setChallengeId(challengeData.id);
      setMfaStep("verify");
      setLoading(false);
    } else {
      // MFA not enrolled - enroll now
      const { data: enrollData, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Divinyl Admin",
      });
      if (enrollError) {
        setError("Erreur lors de l'activation MFA: " + enrollError.message);
        setLoading(false);
        return;
      }
      setQrUri(enrollData.totp.qr_code);
      setFactorId(enrollData.id);
      setMfaStep("enroll");
      setLoading(false);
    }
  };

  const handleEnrollVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Challenge then verify to complete enrollment
    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeError) {
      setError("Erreur: " + challengeError.message);
      setLoading(false);
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code: totpCode,
    });

    if (verifyError) {
      setError("Code incorrect. Veuillez réessayer.");
      setLoading(false);
      return;
    }

    navigate("/admin");
  };

  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code: totpCode,
    });

    if (verifyError) {
      setError("Code incorrect. Veuillez réessayer.");
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
        <p className="text-sm text-muted-foreground font-body mb-8">
          {mfaStep === "login" && "Connectez-vous pour gérer votre catalogue."}
          {mfaStep === "enroll" && "Configurez la double authentification."}
          {mfaStep === "verify" && "Entrez le code de votre application."}
        </p>

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm font-body p-3 rounded-sm mb-4">
            {error}
          </div>
        )}

        {/* Step 1: Login */}
        {mfaStep === "login" && (
          <>
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

            <button
              type="button"
              onClick={async () => {
                if (!email) {
                  setError("Veuillez saisir votre email d'abord");
                  return;
                }
                setLoading(true);
                setError("");
                const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                  redirectTo: `${window.location.origin}/reset-password`,
                });
                setLoading(false);
                if (resetError) {
                  setError("Erreur lors de l'envoi. Veuillez réessayer.");
                } else {
                  setError("");
                  alert("Un email de réinitialisation a été envoyé à " + email);
                }
              }}
              disabled={loading}
              className="w-full mt-3 text-sm text-muted-foreground hover:text-foreground font-body transition-colors underline underline-offset-4"
            >
              Mot de passe oublié ?
            </button>
          </>
        )}

        {/* Step 2: MFA Enrollment (first time) */}
        {mfaStep === "enroll" && (
          <form onSubmit={handleEnrollVerify} className="space-y-6">
            <div className="bg-muted border border-border rounded-sm p-4 text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-foreground">
                <Smartphone className="w-5 h-5" />
                <span className="font-body font-semibold text-sm">Configuration requise</span>
              </div>
              <p className="text-xs text-muted-foreground font-body">
                Scannez ce QR code avec une application d'authentification (Google Authenticator, Authy, etc.)
              </p>
              {qrUri && (
                <div className="flex justify-center">
                  <img src={qrUri} alt="QR Code MFA" className="w-48 h-48" />
                </div>
              )}
            </div>

            <div className="relative">
              <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="Code à 6 chiffres"
                required
                autoFocus
                className="w-full bg-muted border border-border rounded-sm pl-10 pr-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors text-center tracking-[0.5em]"
              />
            </div>

            <button
              type="submit"
              disabled={loading || totpCode.length !== 6}
              className="w-full py-3 bg-foreground text-background font-body font-semibold rounded-sm tracking-wide uppercase text-sm hover:opacity-85 transition-all duration-300 disabled:opacity-50"
            >
              {loading ? "Vérification…" : "Activer et se connecter"}
            </button>
          </form>
        )}

        {/* Step 3: MFA Verification (returning user) */}
        {mfaStep === "verify" && (
          <form onSubmit={handleMfaVerify} className="space-y-6">
            <div className="bg-muted border border-border rounded-sm p-4 text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-foreground">
                <ShieldCheck className="w-5 h-5" />
                <span className="font-body font-semibold text-sm">Double authentification</span>
              </div>
              <p className="text-xs text-muted-foreground font-body">
                Entrez le code affiché dans votre application d'authentification.
              </p>
            </div>

            <div className="relative">
              <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="Code à 6 chiffres"
                required
                autoFocus
                className="w-full bg-muted border border-border rounded-sm pl-10 pr-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors text-center tracking-[0.5em]"
              />
            </div>

            <button
              type="submit"
              disabled={loading || totpCode.length !== 6}
              className="w-full py-3 bg-foreground text-background font-body font-semibold rounded-sm tracking-wide uppercase text-sm hover:opacity-85 transition-all duration-300 disabled:opacity-50"
            >
              {loading ? "Vérification…" : "Vérifier"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminLogin;
