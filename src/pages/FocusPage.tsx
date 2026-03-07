import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import { useUserKey, recordStudySession } from "@/hooks/useGamification";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Timer, Play, Pause, RotateCcw, Zap, Coffee } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PRESETS = [
  { label: "Pomodoro", minutes: 25, icon: "🍅" },
  { label: "Foco Curto", minutes: 15, icon: "⚡" },
  { label: "Estudo Longo", minutes: 45, icon: "📚" },
  { label: "Sprint", minutes: 5, icon: "🏃" },
];

export default function FocusPage() {
  const userKey = useUserKey();
  const { toast } = useToast();
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [remaining, setRemaining] = useState(25 * 60);
  const [active, setActive] = useState(false);
  const [completed, setCompleted] = useState(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (active && remaining > 0) {
      intervalRef.current = window.setInterval(() => setRemaining(r => r - 1), 1000);
    } else if (remaining <= 0 && active) {
      setActive(false);
      setCompleted(c => c + 1);
      toast({ title: "⏰ Tempo finalizado!", description: "Ótimo trabalho! Descanse um pouco." });
      if (userKey) {
        recordStudySession(userKey, { duration_minutes: Math.ceil(totalSeconds / 60), session_type: "focus" });
      }
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [active, remaining]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const progress = ((totalSeconds - remaining) / totalSeconds) * 100;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto p-4 md:p-6 max-w-xl space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Timer className="h-8 w-8 text-red-500" />
            Cronômetro de Foco
          </h1>
          <p className="text-muted-foreground mt-1">Mantenha o foco e ganhe XP por cada sessão!</p>
        </motion.div>

        {/* Timer */}
        <Card className="text-center">
          <CardContent className="p-8 space-y-6">
            <div className="relative inline-flex items-center justify-center">
              <svg className="w-48 h-48 -rotate-90">
                <circle cx="96" cy="96" r="88" fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/30" />
                <circle cx="96" cy="96" r="88" fill="none" stroke="currentColor" strokeWidth="6"
                  className="text-primary" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 88} strokeDashoffset={2 * Math.PI * 88 * (1 - progress / 100)}
                />
              </svg>
              <div className="absolute text-5xl font-mono font-bold">{formatTime(remaining)}</div>
            </div>

            <div className="flex gap-3 justify-center">
              <Button size="lg" variant={active ? "destructive" : "default"} onClick={() => setActive(!active)}>
                {active ? <><Pause className="h-5 w-5 mr-2" />Pausar</> : <><Play className="h-5 w-5 mr-2" />Iniciar</>}
              </Button>
              <Button size="lg" variant="outline" onClick={() => { setActive(false); setRemaining(totalSeconds); }}>
                <RotateCcw className="h-5 w-5" />
              </Button>
            </div>

            {completed > 0 && (
              <Badge variant="secondary" className="text-base gap-2">
                <Zap className="h-4 w-4" />
                {completed} sessões completas
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Presets */}
        <div className="grid grid-cols-2 gap-3">
          {PRESETS.map(p => (
            <Card key={p.label} className={`cursor-pointer transition-all hover:border-primary/50 ${totalSeconds === p.minutes * 60 ? "border-primary" : ""}`}
              onClick={() => { setTotalSeconds(p.minutes * 60); setRemaining(p.minutes * 60); setActive(false); }}
            >
              <CardContent className="p-4 text-center">
                <div className="text-2xl mb-1">{p.icon}</div>
                <div className="font-medium text-sm">{p.label}</div>
                <div className="text-xs text-muted-foreground">{p.minutes} min</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tips */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Coffee className="h-4 w-4" />
              Dicas de Foco
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            <p>• Elimine distrações: silêncio no celular</p>
            <p>• Defina uma meta clara antes de começar</p>
            <p>• A cada 25 min, descanse 5 min</p>
            <p>• Beba água durante o estudo</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
