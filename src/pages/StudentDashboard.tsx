import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import { useProfile, useBrainMap, useDailyMissions, useErrors, useUserKey, getGradePrediction, updateProfile } from "@/hooks/useGamification";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Flame, Trophy, Brain, Target, Zap, BookOpen, Swords, Timer, TrendingUp, AlertTriangle, Sparkles, GraduationCap, Pencil, Check, X, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TURMAS } from "@/lib/constants";

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

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto p-6 flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-muted-foreground">Carregando...</div>
        </div>
      </div>
    );
  }

  const xpInCurrentLevel = profile ? profile.xp - totalXpForLevel(profile.level) : 0;
  const xpNeeded = profile ? xpForLevel(profile.level) : 100;
  const xpProgress = Math.min(100, Math.round((xpInCurrentLevel / xpNeeded) * 100));

  const missionsList = missions?.missions || [];
  const completedMissions = (missionsList as any[]).filter((m: any) => m.current >= m.target).length;

  // Weekly study goal
  const weeklyGoal = 50;
  const weeklyProgress = Math.min(weeklyGoal, Math.round((profile?.total_study_minutes || 0) / 5));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        {/* Profile Banner */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
                    {profile?.display_name?.[0] || "E"}
                  </div>
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
                        <h1 className="text-2xl font-bold">{profile?.display_name}</h1>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingName(true); setNewName(profile?.display_name || ""); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="secondary" className="gap-1">
                        <GraduationCap className="h-3 w-3" />
                        Nível {profile?.level} — {getLevelName(profile?.level || 1)}
                      </Badge>
                      {(profile?.streak_days || 0) > 0 && (
                        <Badge variant="destructive" className="gap-1">
                          <Flame className="h-3 w-3" />
                          {profile?.streak_days} dias seguidos 🔥
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
                  <div className="text-3xl font-bold text-primary">{profile?.xp?.toLocaleString()} XP</div>
                  <div className="text-sm text-muted-foreground">{profile?.total_study_minutes || 0} min estudados</div>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progresso do nível</span>
                  <span>{xpInCurrentLevel}/{xpNeeded} XP</span>
                </div>
                <Progress value={xpProgress} className="h-3" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Weekly Goal */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Meta Semanal</span>
                </div>
                <span className="text-xs text-muted-foreground">{weeklyProgress}/{weeklyGoal} exercícios</span>
              </div>
              <Progress value={(weeklyProgress / weeklyGoal) * 100} className="h-2" />
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[
            { icon: Zap, label: "Desafio 30s", desc: "Modo rápido", href: "/challenge", color: "text-yellow-500" },
            { icon: Swords, label: "Batalha", desc: "Desafiar", href: "/battle", color: "text-red-500" },
            { icon: Target, label: "Simulado", desc: "Modo prova", href: "/simulator", color: "text-blue-500" },
            { icon: AlertTriangle, label: "Lab de Erros", desc: "Revisar", href: "/error-lab", color: "text-orange-500" },
            { icon: Timer, label: "Foco", desc: "Cronômetro", href: "/focus", color: "text-purple-500" },
            { icon: Sparkles, label: "IA Tutor", desc: "Estudar", href: "/auto-study", color: "text-emerald-500" },
          ].map((action, i) => (
            <motion.div key={action.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Link to={action.href}>
                <Card className="hover:border-primary/50 transition-all cursor-pointer group">
                  <CardContent className="p-3 flex flex-col items-center gap-1 text-center">
                    <action.icon className={`h-6 w-6 ${action.color} group-hover:scale-110 transition-transform`} />
                    <span className="text-xs font-medium">{action.label}</span>
                    <span className="text-[10px] text-muted-foreground">{action.desc}</span>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Daily Missions */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="h-5 w-5 text-primary" />
                  Missões do Dia
                  <Badge variant="outline" className="ml-auto">{completedMissions}/{(missionsList as any[]).length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {missionsLoading ? (
                  <div className="text-muted-foreground text-sm">Carregando...</div>
                ) : (missionsList as any[]).map((m: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs ${m.current >= m.target ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"}`}>
                      {m.current >= m.target ? "✓" : i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{m.title}</div>
                      <Progress value={Math.min(100, (m.current / m.target) * 100)} className="h-1.5 mt-1" />
                    </div>
                    <Badge variant="secondary" className="text-xs">+{m.xp} XP</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Brain Map */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Brain className="h-5 w-5 text-purple-500" />
                  Mapa do Cérebro
                </CardTitle>
              </CardHeader>
              <CardContent>
                {brainLoading ? (
                  <div className="text-muted-foreground text-sm">Carregando...</div>
                ) : brainTopics.length === 0 ? (
                  <div className="text-muted-foreground text-sm text-center py-4">
                    Comece a estudar para ativar seu mapa cerebral! 🧠
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {brainTopics.slice(0, 10).map((t: any, i: number) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-lg">
                          {t.mastery_percent >= 70 ? "🟢" : t.mastery_percent >= 40 ? "🟡" : "🔴"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm truncate">{t.topic} <span className="text-xs text-muted-foreground">({t.subject})</span></div>
                          <Progress value={t.mastery_percent} className="h-1.5" />
                        </div>
                        <span className="text-xs text-muted-foreground">{t.mastery_percent}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Grade Prediction */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Previsão de Nota
                </CardTitle>
              </CardHeader>
              <CardContent>
                {predictions.length === 0 ? (
                  <div className="text-muted-foreground text-sm text-center py-4">
                    Resolva exercícios para ver sua previsão! 📊
                  </div>
                ) : (
                  <div className="space-y-3">
                    {predictions.map((p: any, i: number) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-sm font-medium capitalize">{p.subject}</span>
                        <span className={`text-lg font-bold ${p.predicted_grade >= 7 ? "text-green-500" : p.predicted_grade >= 5 ? "text-yellow-500" : "text-red-500"}`}>
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
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Erros Frequentes
                  {errors.length > 0 && <Badge variant="destructive" className="ml-auto">{errors.length}</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {errorsLoading ? (
                  <div className="text-muted-foreground text-sm">Carregando...</div>
                ) : errors.length === 0 ? (
                  <div className="text-muted-foreground text-sm text-center py-4">
                    Nenhum erro registrado! Continue assim! 🎉
                  </div>
                ) : (
                  <div className="space-y-2">
                    {errors.slice(0, 4).map((e: any, i: number) => (
                      <div key={i} className="text-sm p-2 rounded-lg bg-destructive/5 border border-destructive/10">
                        <div className="font-medium truncate">{e.question_text}</div>
                        <div className="text-xs text-muted-foreground mt-1">{e.subject} • Errou {e.error_count}x</div>
                      </div>
                    ))}
                    {errors.length > 4 && (
                      <Link to="/error-lab">
                        <Button variant="outline" size="sm" className="w-full">Ver todos os erros</Button>
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { icon: Trophy, label: "Ranking", desc: "Classificação", href: "/ranking", color: "text-yellow-500" },
            { icon: BookOpen, label: "Aulas", desc: "Conteúdo", href: "/", color: "text-green-500" },
            { icon: Brain, label: "Chat IA", desc: "Pergunte", href: "/chat", color: "text-purple-500" },
          ].map((item) => (
            <Link key={item.label} to={item.href}>
              <Card className="hover:border-primary/30 transition-all cursor-pointer">
                <CardContent className="p-3 flex items-center gap-3">
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                  <div>
                    <span className="text-sm font-medium block">{item.label}</span>
                    <span className="text-xs text-muted-foreground">{item.desc}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
