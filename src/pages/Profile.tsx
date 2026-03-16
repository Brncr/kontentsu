import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useSavedScripts } from "@/hooks/useSavedScripts";
import { ArrowLeft, Save, Loader2, Gamepad2, Globe, Cpu, ScrollText, Twitter, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import kontentsuLogo from "@/assets/kontentsu-logotype.png";

const Profile = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile, loading, updateProfile } = useProfile();
  const { stats } = useSavedScripts();
  const { toast } = useToast();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);

  const startEditing = () => {
    setName(profile?.display_name || "");
    setBio(profile?.bio || "");
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ display_name: name, bio });
      setEditing(false);
      toast({ title: "✅ Perfil atualizado", description: "Suas alterações foram salvas." });
    } catch {
      toast({ title: "Erro", description: "Não foi possível salvar.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "hsl(var(--primary))" }} />
      </div>
    );
  }

  const statCards = [
    { label: "Total", value: stats.total, icon: <ScrollText className="w-4 h-4" />, color: "hsl(var(--primary))" },
    { label: "Games", value: stats.games, icon: <Gamepad2 className="w-4 h-4" />, color: "#c77dff" },
    { label: "Web3", value: stats.web3, icon: <Globe className="w-4 h-4" />, color: "#00ff87" },
    { label: "GameDev", value: stats.tech, icon: <Cpu className="w-4 h-4" />, color: "#4d9fff" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20" style={{ borderBottom: "1px solid hsl(var(--border))", background: "hsl(228 22% 5% / 0.92)", backdropFilter: "blur(24px)" }}>
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(90deg, transparent 0%, hsl(var(--primary)) 30%, hsl(var(--accent)) 70%, transparent 100%)" }} />
        <div className="max-w-3xl mx-auto px-4 sm:px-8 h-[56px] flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest transition-all" style={{ fontFamily: "var(--font-sub)", color: "hsl(var(--muted-foreground))" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "hsl(var(--primary))"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "hsl(var(--muted-foreground))"; }}>
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <div className="flex items-center gap-2">
            <img src={kontentsuLogo} alt="Kontentsu" className="h-5 object-contain" style={{ filter: "drop-shadow(0 0 8px hsl(var(--primary) / 0.5))" }} />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        {/* Profile Card */}
        <div className="rounded-2xl overflow-hidden animate-slide-up" style={{ background: "var(--gradient-surface)", border: "1px solid hsl(var(--border))", boxShadow: "0 4px 48px hsl(230 25% 2% / 0.7)" }}>
          <div className="h-[2px] w-full" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.4), hsl(var(--accent) / 0.4), transparent)" }} />

          <div className="p-6 sm:p-8">
            <div className="flex items-start gap-5">
              {/* Avatar */}
              <img
                src={profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture}
                alt={profile?.display_name || "User"}
                className="w-20 h-20 rounded-2xl object-cover flex-shrink-0"
                style={{ border: "3px solid hsl(var(--primary) / 0.4)", boxShadow: "0 0 24px hsl(var(--primary) / 0.2)" }}
                referrerPolicy="no-referrer"
              />

              <div className="flex-1 min-w-0 space-y-1">
                {editing ? (
                  <div className="space-y-3">
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Seu nome"
                      className="w-full bg-transparent text-lg font-black tracking-wide px-3 py-2 rounded-xl outline-none"
                      style={{ fontFamily: "var(--font-display)", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--primary) / 0.4)", background: "hsl(var(--muted) / 0.3)" }}
                    />
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Uma bio curta sobre você..."
                      rows={2}
                      className="w-full bg-transparent text-sm px-3 py-2 rounded-xl outline-none resize-none"
                      style={{ color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))", background: "hsl(var(--muted) / 0.3)", fontFamily: "var(--font-body)" }}
                    />
                    <div className="flex gap-2">
                      <button onClick={handleSave} disabled={saving}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all"
                        style={{ background: "hsl(var(--primary) / 0.15)", border: "1px solid hsl(var(--primary) / 0.4)", color: "hsl(var(--primary))", fontFamily: "var(--font-sub)" }}>
                        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                        Salvar
                      </button>
                      <button onClick={() => setEditing(false)}
                        className="px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest"
                        style={{ background: "hsl(var(--muted) / 0.5)", border: "1px solid hsl(var(--border))", color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-sub)" }}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-black tracking-wide" style={{ fontFamily: "var(--font-display)", color: "hsl(var(--foreground))" }}>
                      {profile?.display_name || "Usuário"}
                    </h2>
                    <p className="text-[12px]" style={{ color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-body)" }}>
                      {user?.email}
                    </p>
                    {profile?.bio && (
                      <p className="text-[13px] mt-2" style={{ color: "hsl(var(--foreground) / 0.7)", fontFamily: "var(--font-body)" }}>
                        {profile.bio}
                      </p>
                    )}
                    <button onClick={startEditing}
                      className="mt-3 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                      style={{ background: "hsl(var(--muted) / 0.5)", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))", fontFamily: "var(--font-sub)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "hsl(var(--primary) / 0.5)"; e.currentTarget.style.color = "hsl(var(--primary))"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "hsl(var(--border))"; e.currentTarget.style.color = "hsl(var(--foreground))"; }}>
                      Editar Perfil
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          {statCards.map((s) => (
            <div key={s.label} className="rounded-xl p-4 text-center" style={{ background: "hsl(var(--muted) / 0.35)", border: "1px solid hsl(var(--border))" }}>
              <div className="flex items-center justify-center gap-1.5 mb-2" style={{ color: s.color }}>
                {s.icon}
                <span className="text-[9px] font-black uppercase tracking-widest" style={{ fontFamily: "var(--font-sub)" }}>{s.label}</span>
              </div>
              <p className="text-2xl font-black" style={{ fontFamily: "var(--font-display)", color: s.color, lineHeight: 1 }}>{s.value}</p>
              <p className="text-[9px] mt-1 uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-sub)" }}>scripts</p>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <button onClick={() => navigate("/history")}
            className="flex items-center gap-3 p-4 rounded-xl text-left transition-all group"
            style={{ background: "hsl(var(--muted) / 0.35)", border: "1px solid hsl(var(--border))" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "hsl(var(--primary) / 0.5)"; e.currentTarget.style.boxShadow = "0 0 24px hsl(var(--primary) / 0.1)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "hsl(var(--border))"; e.currentTarget.style.boxShadow = ""; }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "hsl(var(--primary) / 0.12)", border: "1px solid hsl(var(--primary) / 0.3)", color: "hsl(var(--primary))" }}>
              <ScrollText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[12px] font-black uppercase tracking-widest" style={{ fontFamily: "var(--font-display)", color: "hsl(var(--foreground))" }}>Meus Scripts</p>
              <p className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-sub)" }}>{stats.total} scripts salvos</p>
            </div>
          </button>

          <button onClick={handleLogout}
            className="flex items-center gap-3 p-4 rounded-xl text-left transition-all"
            style={{ background: "hsl(var(--destructive) / 0.06)", border: "1px solid hsl(var(--destructive) / 0.2)" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "hsl(var(--destructive) / 0.5)"; e.currentTarget.style.background = "hsl(var(--destructive) / 0.12)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "hsl(var(--destructive) / 0.2)"; e.currentTarget.style.background = "hsl(var(--destructive) / 0.06)"; }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "hsl(var(--destructive) / 0.12)", border: "1px solid hsl(var(--destructive) / 0.3)", color: "hsl(var(--destructive))" }}>
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[12px] font-black uppercase tracking-widest" style={{ fontFamily: "var(--font-display)", color: "hsl(var(--destructive))" }}>Sair</p>
              <p className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-sub)" }}>Encerrar sessão</p>
            </div>
          </button>
        </div>
      </main>
    </div>
  );
};

export default Profile;
