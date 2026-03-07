import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { KeyRound, Loader2, BookOpen, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import ThemeToggle from "@/components/ThemeToggle";

const SUPABASE_URL = "https://juxdfkzaxhunvekjfybp.supabase.co";

const LoginPage = () => {
  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, setAdminKey } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/auth-login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: key.trim() }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Erro de acesso",
          description: data.error || "Senha inválida",
          variant: "destructive",
        });
        return;
      }

      login(data.role, data.name, data.token);

      if (data.role === "admin") {
        setAdminKey(key.trim());
        toast({ title: `Bem-vindo, ${data.name}! 👑`, description: "Acesso de administrador liberado." });
        navigate("/admin");
      } else {
        localStorage.setItem("epistemologia_user_key", key.trim());
        toast({ title: "Acesso liberado! 🎉", description: "Bons estudos!" });
        navigate("/");
      }
    } catch {
      toast({
        title: "Erro de conexão",
        description: "Verifique sua internet e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg">
              <BookOpen className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold font-display text-foreground">EPISTEMOLOGIA</h1>
          <p className="text-muted-foreground mt-2">Acesse com sua senha de estudante</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Digite sua senha"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="pl-10"
                autoFocus
                maxLength={20}
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading || !key.trim()}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <KeyRound className="h-4 w-4 mr-2" />
              )}
              Entrar
            </Button>
          </div>

          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
            <p>Cada senha funciona apenas uma vez. Não compartilhe sua senha.</p>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default LoginPage;
