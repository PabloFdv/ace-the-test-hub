import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import { useProfile, useBrainMap, useDailyMissions, useErrors, useUserKey, getGradePrediction, updateProfile, getExamRadar } from "@/hooks/useGamification";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Flame, Trophy, Brain, Target, Zap, BookOpen, Swords, Timer,
  TrendingUp, AlertTriangle, Sparkles, GraduationCap, Pencil, Check, X,
  Users, Star, Lock, Eye, CalendarClock, Lightbulb, Radar, Skull
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TURMAS, ALL_SUBJECTS } from "@/lib/constants";

const LEVEL_NAMES: Record<number, string> = {
  1: "Iniciante", 2: "Aprendiz", 3: "Aprendiz", 4: "Aprendiz", 5: "Estudante",
  6: "Estudante", 7: "Estudante", 8: "Estudante", 9: "Estudante", 10: "Mestre da Turma",
  15: "Especialista", 20: "Gênio da Escola", 25: "Lenda", 30: "Imortal"
};

function getLevelName(level: number): string {
  const keys = Object.keys(LEVEL_NAMES).map(Number).sort((a, b) => b - a);
  for (const k of keys) { if (level >= k) return LEVEL_NAMES[k]; }
  return "Iniciante";
}

function xpForLevel(level: number): number { return level * 100 + (level - 1) * 50; }
function totalXpForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) total += xpForLevel(i);
  return total;
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

// Generate deterministic daily data from date
function getDailySeed(): number {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

export default function StudentDashboard() {
  const { profile, loading: profileLoading, refresh, setProfile } = useProfile();
  const { topics: brainTopics, loading: brainLoading } = useBrainMap();
  const { missions, loading: missionsLoading } = useDailyMissions();
  const { errors, loading: errorsLoading } = useErrors();
  const userKey = useUserKey();
  const { toast } = useToast();
  const [predictions, setPredictions] = useState<any[]>([]);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingTurma, setEditingTurma] = useState(false);
  const [secretMissionRevealed, setSecretMissionRevealed] = useState(false);

  useEffect(() => {
    if (userKey) {
      getGradePrediction(userKey).then(r => setPredictions(r.predictions || [])).catch(console.error);
    }
  }, [userKey]);

  const handleSaveName = async () => {
    if (!userKey || !newName.trim()) return;
    try {
      const res = await updateProfile(userKey, { display_name: newName.trim() });
      setProfile(res.profile);
      setEditingName(false);
      toast({ title: "Nome atualizado! ✅" });
    } catch {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    }
  };

  const handleSaveTurma = async (turma: string) => {
    if (!userKey) return;
    try {
      const res = await updateProfile(userKey, { turma });
      setProfile(res.profile);
      setEditingTurma(false);
      toast({ title: "Turma atualizada! ✅" });
    } catch {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    }
  };

  // Secret mission of the day (deterministic from date + user)
  const secretMission = useMemo(() => {
    const seed = getDailySeed();
    const missions = [
      { title: "Acerte 5 questões seguidas sem errar", xp: 120, emoji: "🎯" },
      { title: "Complete 3 batalhas em matérias diferentes", xp: 150, emoji: "⚔️" },
      { title: "Faça um simulado com nota acima de 8", xp: 200, emoji: "🏆" },
      { title: "Estude por 20 minutos sem parar", xp: 100, emoji: "⏱️" },
      { title: "Acerte 10 questões de Português", xp: 130, emoji: "📖" },
      { title: "Resolva o desafio 30s com 5+ acertos", xp: 110, emoji: "⚡" },
      { title: "Revise 3 erros do laboratório de erros", xp: 90, emoji: "🔬" },
    ];
    return missions[seed % missions.length];
  }, []);

  // Exam alerts (simulated upcoming exams)
  const examAlerts = useMemo(() => {
    const seed = getDailySeed();
    const allExams = [
      { subject: "Matemática", daysLeft: 2, icon: "📐" },
      { subject: "História", daysLeft: 4, icon: "📚" },
      { subject: "Português", daysLeft: 6, icon: "✍️" },
      { subject: "Física", daysLeft: 3, icon: "⚡" },
      { subject: "Química", daysLeft: 5, icon: "🧪" },
      { subject: "Biologia", daysLeft: 7, icon: "🧬" },
    ];
    // Show 3 exams based on day
    return allExams.sort((a, b) => ((a.subject.charCodeAt(0) + seed) % 10) - ((b.subject.charCodeAt(0) + seed) % 10)).slice(0, 3);
  }, []);

  // Talent detector
  const detectedTalent = useMemo(() => {
    if (!brainTopics || brainTopics.length === 0) return null;
    const best = brainTopics.reduce((prev: any, curr: any) =>
      (curr.mastery_percent > (prev?.mastery_percent || 0)) ? curr : prev, null);
    if (!best || best.mastery_percent < 50) return null;
    const talents: Record<string, string> = {
      matematica: "Cálculo mental", portugues: "Interpretação textual",
      historia: "Raciocínio histórico", geografia: "Análise geográfica",
      fisica: "Raciocínio físico", quimica: "Análise química",
      biologia: "Conhecimento biológico", ingles: "Fluência em inglês",
      logica: "Lógica avançada", ciencias: "Pensamento científico",
    };
    return { name: talents[best.subject] || "Habilidade especial", subject: best.subject, percent: best.mastery_percent };
  }, [brainTopics]);

  // Impossible challenge
  const impossibleChallenge = useMemo(() => {
    const seed = getDailySeed();
    const challenges = [
      "Resolva: Se x³ + y³ = 35 e x + y = 5, qual é xy?",
      "Traduza: 'The quintessence of epistemological inquiry'",
      "Qual elemento tem o maior raio atômico do período 3?",
      "Em que ano o Tratado de Tordesilhas foi assinado?",
      "Simplifique: (sen²x + cos²x)² - 2sen²x·cos²x",
    ];
    return challenges[seed % challenges.length];
  }, []);

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto p-6 flex items-center justify-center min-h-[60vh]">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando seu painel...</p>
          </motion.div>
        </div>
      </div>
    );
  }

  const xpInCurrentLevel = profile ? profile.xp - totalXpForLevel(profile.level) : 0;
  const xpNeeded = profile ? xpForLevel(profile.level) : 100;
  const xpProgress = Math.min(100, Math.round((xpInCurrentLevel / xpNeeded) * 100));

  const missionsList = missions?.missions || [];
  const completedMissions = (missionsList as any[]).filter((m: any) => m.current >= m.target).length;

  const weeklyGoal = 50;
  const weeklyProgress = Math.min(weeklyGoal, Math.round((profile?.total_study_minutes || 0) / 5));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto p-4 md:p-6 space-y-5 max-w-5xl">
        {/* Profile Banner */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="overflow-hidden border-0 shadow-card-hover">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/8 via-transparent to-accent/8 pointer-events-none" />
            <CardContent className="p-6 relative">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <motion.div whileHover={{ scale: 1.05 }} className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-glow">
                    {profile?.display_name?.[0] || "E"}
                  </motion.div>
                  <div className="flex-1">
                    {editingName ? (
                      <div className="flex items-center gap-2">
                        <Input value={newName} onChange={e => setNewName(e.target.value)} className="h-8 max-w-48"
                          placeholder="Seu nome" autoFocus onKeyDown={e => e.key === "Enter" && handleSaveName()} />
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleSaveName}><Check className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingName(false)}><X className="h-4 w-4" /></Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-black font-display">{profile?.display_name}</h1>
                        <Button size="icon" variant="ghost" className="h-7 w-7 opacity-50 hover:opacity-100" onClick={() => { setEditingName(true); setNewName(profile?.display_name || ""); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="secondary" className="gap-1 font-semibold">
                        <GraduationCap className="h-3 w-3" />
                        Nível {profile?.level} — {getLevelName(profile?.level || 1)}
                      </Badge>
                      {(profile?.streak_days || 0) > 0 && (
                        <Badge className="gap-1 bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
                          <Flame className="h-3 w-3" />
                          {profile?.streak_days} dias 🔥
                        </Badge>
                      )}
                    </div>
                    {/* Turma */}
                    <div className="flex items-center gap-2 mt-2">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      {editingTurma ? (
                        <div className="flex items-center gap-2">
                          <Select value={profile?.turma || ""} onValueChange={handleSaveTurma}>
                            <SelectTrigger className="h-7 text-xs max-w-64"><SelectValue placeholder="Selecionar turma" /></SelectTrigger>
                            <SelectContent>
                              {TURMAS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingTurma(false)}><X className="h-3 w-3" /></Button>
                        </div>
                      ) : (
                        <button onClick={() => setEditingTurma(true)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                          {profile?.turma || "Selecionar turma →"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-gradient">{profile?.xp?.toLocaleString()} XP</div>
                  <div className="text-sm text-muted-foreground">{profile?.total_study_minutes || 0} min estudados</div>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="text-muted-foreground">Progresso do nível</span>
                  <span className="text-primary">{xpInCurrentLevel}/{xpNeeded} XP</span>
                </div>
                <Progress value={xpProgress} className="h-2.5" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Weekly Goal + Streak */}
        <motion.div initial="hidden" animate="show" variants={stagger} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <motion.div variants={fadeUp}>
            <Card className="hover-lift">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Target className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-semibold">Meta Semanal</span>
                  </div>
                  <span className="text-xs font-bold text-primary">{weeklyProgress}/{weeklyGoal}</span>
                </div>
                <Progress value={(weeklyProgress / weeklyGoal) * 100} className="h-2" />
                <p className="text-[11px] text-muted-foreground mt-1.5">Resolva exercícios para completar sua meta!</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={fadeUp}>
            <Card className="hover-lift">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                    <Flame className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-black">{profile?.streak_days || 0} dias</div>
                    <div className="text-xs text-muted-foreground">Sequência de estudo 🔥</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div initial="hidden" animate="show" variants={stagger} className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {[
            { icon: Zap, label: "Desafio 30s", href: "/challenge", gradient: "from-amber-500 to-orange-600" },
            { icon: Swords, label: "Batalha", href: "/battle", gradient: "from-red-500 to-rose-600" },
            { icon: Target, label: "Simulado", href: "/simulator", gradient: "from-blue-500 to-indigo-600" },
            { icon: AlertTriangle, label: "Lab Erros", href: "/error-lab", gradient: "from-orange-500 to-amber-600" },
            { icon: Timer, label: "Foco", href: "/focus", gradient: "from-purple-500 to-violet-600" },
            { icon: Sparkles, label: "IA Tutor", href: "/auto-study", gradient: "from-emerald-500 to-green-600" },
          ].map((action, i) => (
            <motion.div key={action.label} variants={fadeUp}>
              <Link to={action.href}>
                <Card className="hover-lift cursor-pointer group">
                  <CardContent className="p-3 flex flex-col items-center gap-1.5 text-center">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      <action.icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-[11px] font-semibold leading-tight">{action.label}</span>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* ENGAGEMENT ROW: Exam Alert + Secret Mission */}
        <motion.div initial="hidden" animate="show" variants={stagger} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Exam Alerts */}
          <motion.div variants={fadeUp}>
            <Card className="border-orange-500/20 hover-lift">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarClock className="h-5 w-5 text-orange-500" />
                  Provas da Semana
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {examAlerts.map((exam, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-orange-500/5 border border-orange-500/10">
                    <span className="text-xl">{exam.icon}</span>
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{exam.subject}</div>
                      <div className="text-xs text-muted-foreground">em {exam.daysLeft} dias</div>
                    </div>
                    <Link to={`/simulator`}>
                      <Button size="sm" variant="outline" className="text-xs h-7 border-orange-500/30 text-orange-600 hover:bg-orange-500/10">
                        Treinar
                      </Button>
                    </Link>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Secret Mission */}
          <motion.div variants={fadeUp}>
            <Card className="border-purple-500/20 hover-lift overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Lock className="h-5 w-5 text-purple-500" />
                  Missão Secreta do Dia
                  <Badge className="ml-auto bg-purple-500/10 text-purple-500 border-purple-500/20 text-[10px]">+{secretMission.xp} XP</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AnimatePresence mode="wait">
                  {!secretMissionRevealed ? (
                    <motion.div key="hidden" exit={{ opacity: 0, scale: 0.9 }} className="text-center py-3">
                      <div className="text-4xl mb-2 animate-float">🔮</div>
                      <p className="text-sm text-muted-foreground mb-3">Uma missão secreta está esperando por você...</p>
                      <Button variant="outline" size="sm" className="border-purple-500/30 text-purple-600" onClick={() => setSecretMissionRevealed(true)}>
                        <Eye className="h-3.5 w-3.5 mr-1.5" />Revelar Missão
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div key="revealed" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-2">
                      <div className="flex items-start gap-3">
                        <span className="text-3xl">{secretMission.emoji}</span>
                        <div>
                          <p className="text-sm font-semibold">{secretMission.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">Complete para ganhar <span className="text-purple-500 font-bold">+{secretMission.xp} XP</span> e uma badge rara!</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Talent Detector + Impossible Challenge */}
        <motion.div initial="hidden" animate="show" variants={stagger} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Talent Detector */}
          <motion.div variants={fadeUp}>
            <Card className="border-emerald-500/20 hover-lift">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="h-5 w-5 text-emerald-500" />
                  Detector de Talento
                </CardTitle>
              </CardHeader>
              <CardContent>
                {detectedTalent ? (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
                      <Lightbulb className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-emerald-600">Talento detectado!</div>
                      <div className="text-sm font-semibold">{detectedTalent.name}</div>
                      <div className="text-xs text-muted-foreground">{detectedTalent.percent}% de domínio em {ALL_SUBJECTS.find(s => s.id === detectedTalent.subject)?.name}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="text-3xl mb-2">🔍</div>
                    <p className="text-sm text-muted-foreground">Continue estudando para desbloquear seu talento!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Impossible Challenge */}
          <motion.div variants={fadeUp}>
            <Card className="border-red-500/20 hover-lift overflow-hidden relative">
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-red-500/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Skull className="h-5 w-5 text-red-500" />
                  Desafio Impossível
                  <Badge variant="destructive" className="ml-auto text-[10px]">EXTREMO</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                  <p className="text-sm font-medium mb-2">{impossibleChallenge}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">0 alunos resolveram hoje</span>
                    <Badge variant="outline" className="text-[10px] border-red-500/30 text-red-500">+500 XP</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Main Grid: Missions + Brain Map */}
        <motion.div initial="hidden" animate="show" variants={stagger} className="grid md:grid-cols-2 gap-4">
          {/* Daily Missions */}
          <motion.div variants={fadeUp}>
            <Card className="hover-lift">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Target className="h-4 w-4 text-primary" />
                  </div>
                  Missões do Dia
                  <Badge variant="outline" className="ml-auto text-xs">{completedMissions}/{(missionsList as any[]).length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {missionsLoading ? (
                  <div className="text-muted-foreground text-sm py-4 text-center">Carregando...</div>
                ) : (missionsList as any[]).length === 0 ? (
                  <div className="text-muted-foreground text-sm text-center py-6">
                    Comece a estudar para receber missões! 🎯
                  </div>
                ) : (missionsList as any[]).map((m: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${m.current >= m.target ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white" : "bg-muted text-muted-foreground"}`}>
                      {m.current >= m.target ? "✓" : i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{m.title}</div>
                      <Progress value={Math.min(100, (m.current / m.target) * 100)} className="h-1.5 mt-1" />
                    </div>
                    <Badge variant="secondary" className="text-[10px] shrink-0">+{m.xp} XP</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Brain Map */}
          <motion.div variants={fadeUp}>
            <Card className="hover-lift">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Brain className="h-4 w-4 text-purple-500" />
                  </div>
                  Mapa do Cérebro
                </CardTitle>
              </CardHeader>
              <CardContent>
                {brainLoading ? (
                  <div className="text-muted-foreground text-sm py-4 text-center">Carregando...</div>
                ) : brainTopics.length === 0 ? (
                  <div className="text-muted-foreground text-sm text-center py-6">
                    Comece a estudar para ativar seu mapa cerebral! 🧠
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {brainTopics.slice(0, 10).map((t: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
                        <span className="text-base">
                          {t.mastery_percent >= 70 ? "🟢" : t.mastery_percent >= 40 ? "🟡" : "🔴"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm truncate">{t.topic} <span className="text-[10px] text-muted-foreground">({t.subject})</span></div>
                          <Progress value={t.mastery_percent} className="h-1" />
                        </div>
                        <span className="text-xs text-muted-foreground font-medium">{t.mastery_percent}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Grade Prediction */}
          <motion.div variants={fadeUp}>
            <Card className="hover-lift">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </div>
                  Previsão de Nota
                </CardTitle>
              </CardHeader>
              <CardContent>
                {predictions.length === 0 ? (
                  <div className="text-muted-foreground text-sm text-center py-6">
                    Resolva exercícios para ver sua previsão! 📊
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {predictions.map((p: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <span className="text-sm font-medium capitalize">{p.subject}</span>
                        <span className={`text-lg font-black ${p.predicted_grade >= 7 ? "text-green-500" : p.predicted_grade >= 5 ? "text-amber-500" : "text-red-500"}`}>
                          {p.predicted_grade.toFixed(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Error Lab Preview */}
          <motion.div variants={fadeUp}>
            <Card className="hover-lift">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                  </div>
                  Erros Frequentes
                  {errors.length > 0 && <Badge variant="destructive" className="ml-auto text-[10px]">{errors.length}</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {errorsLoading ? (
                  <div className="text-muted-foreground text-sm py-4 text-center">Carregando...</div>
                ) : errors.length === 0 ? (
                  <div className="text-muted-foreground text-sm text-center py-6">
                    Nenhum erro registrado! Continue assim! 🎉
                  </div>
                ) : (
                  <div className="space-y-2">
                    {errors.slice(0, 4).map((e: any, i: number) => (
                      <div key={i} className="text-sm p-2.5 rounded-lg bg-destructive/5 border border-destructive/10">
                        <div className="font-medium truncate">{e.question_text}</div>
                        <div className="text-xs text-muted-foreground mt-1">{e.subject} • Errou {e.error_count}x</div>
                      </div>
                    ))}
                    {errors.length > 4 && (
                      <Link to="/error-lab">
                        <Button variant="outline" size="sm" className="w-full text-xs">Ver todos os erros</Button>
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Navigation */}
        <motion.div initial="hidden" animate="show" variants={stagger} className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { icon: Trophy, label: "Ranking", desc: "Classificação", href: "/ranking", gradient: "from-amber-500 to-yellow-600" },
            { icon: BookOpen, label: "Aulas", desc: "Conteúdo", href: "/", gradient: "from-green-500 to-emerald-600" },
            { icon: Brain, label: "Chat IA", desc: "Pergunte", href: "/chat", gradient: "from-purple-500 to-violet-600" },
          ].map((item) => (
            <motion.div key={item.label} variants={fadeUp}>
              <Link to={item.href}>
                <Card className="hover-lift cursor-pointer group">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg`}>
                      <item.icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold block">{item.label}</span>
                      <span className="text-xs text-muted-foreground">{item.desc}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}