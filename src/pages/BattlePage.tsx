import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import { useUserKey, useProfile, getBattles, createBattle, joinBattle, submitBattleScore, deleteBattle } from "@/hooks/useGamification";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Swords, Trophy, Clock, Users, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ALL_SUBJECTS, SAMPLE_QUESTIONS_BY_SUBJECT } from "@/lib/constants";

export default function BattlePage() {
  const userKey = useUserKey();
  const { profile } = useProfile();
  const { toast } = useToast();
  const [battles, setBattles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState("matematica");
  const [playing, setPlaying] = useState<any>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const loadBattles = () => {
    if (userKey) {
      getBattles(userKey).then(r => setBattles(r.battles || [])).catch(console.error).finally(() => setLoading(false));
    }
  };

  useEffect(() => { loadBattles(); }, [userKey]);

  const handleCreate = async () => {
    if (!userKey || !profile) return;
    setCreating(true);
    try {
      const questions = SAMPLE_QUESTIONS_BY_SUBJECT[subject] || SAMPLE_QUESTIONS_BY_SUBJECT.matematica;
      const res = await createBattle(userKey, profile.display_name, subject, questions);
      setBattles(prev => [res.battle, ...prev]);
      toast({ title: "⚔️ Batalha criada!", description: `Matéria: ${ALL_SUBJECTS.find(s => s.id === subject)?.name}. Aguardando oponente...` });
    } catch {
      toast({ title: "Erro", description: "Falha ao criar batalha", variant: "destructive" });
    }
    setCreating(false);
  };

  const handleDelete = async (battleId: string) => {
    if (!userKey) return;
    try {
      await deleteBattle(battleId, userKey);
      setBattles(prev => prev.filter(b => b.id !== battleId));
      toast({ title: "Batalha removida" });
    } catch {
      toast({ title: "Erro ao remover", variant: "destructive" });
    }
  };

  const handleJoin = async (battle: any) => {
    if (!userKey || !profile) return;
    try {
      const res = await joinBattle(battle.id, userKey, profile.display_name);
      setPlaying(res.battle);
      setCurrentQ(0);
      setScore(0);
      setAnswered(false);
      setSelectedAnswer(null);
    } catch {
      toast({ title: "Erro", variant: "destructive" });
    }
  };

  const startPlay = (battle: any) => {
    setPlaying(battle);
    setCurrentQ(0);
    setScore(0);
    setAnswered(false);
    setSelectedAnswer(null);
  };

  const handleAnswer = (answer: string) => {
    if (answered) return;
    setAnswered(true);
    setSelectedAnswer(answer);
    const questions = playing?.questions || [];
    const isCorrect = answer === questions[currentQ]?.correct;
    const newScore = isCorrect ? score + 1 : score;
    if (isCorrect) setScore(newScore);

    setTimeout(() => {
      if (currentQ + 1 < questions.length) {
        setCurrentQ(c => c + 1);
        setAnswered(false);
        setSelectedAnswer(null);
      } else {
        if (userKey && playing) {
          submitBattleScore(playing.id, userKey, newScore);
        }
        toast({ title: "⚔️ Batalha finalizada!", description: `Você acertou ${newScore}/${questions.length}` });
        setPlaying(null);
        loadBattles();
      }
    }, 1200);
  };

  if (playing) {
    const questions = playing.questions || [];
    const q = questions[currentQ];
    if (!q) return null;
    const subjectName = ALL_SUBJECTS.find(s => s.id === playing.subject)?.name || playing.subject;
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto p-4 md:p-6 max-w-xl">
          <div className="flex justify-between items-center mb-4">
            <Badge variant="outline">{subjectName}</Badge>
            <Badge variant="outline">Questão {currentQ + 1}/{questions.length}</Badge>
            <Badge className="gap-1"><Trophy className="h-3 w-3" />{score} acertos</Badge>
          </div>
          <motion.div key={currentQ} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-6">{q.q}</h2>
                <div className="grid grid-cols-2 gap-3">
                  {q.options.map((opt: string) => (
                    <Button key={opt} variant={answered ? (opt === q.correct ? "default" : opt === selectedAnswer ? "destructive" : "outline") : "outline"}
                      className="h-14 text-lg" onClick={() => handleAnswer(opt)} disabled={answered}
                    >
                      {opt}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto p-4 md:p-6 max-w-2xl space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Swords className="h-8 w-8 text-red-500" />
            Batalha
          </h1>
          <p className="text-muted-foreground mt-1">Desafie outros alunos em qualquer matéria!</p>
        </motion.div>

        <Card>
          <CardHeader><CardTitle className="text-lg">Criar Desafio</CardTitle></CardHeader>
          <CardContent className="flex gap-3">
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ALL_SUBJECTS.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Swords className="h-4 w-4 mr-2" />}
              {creating ? "Criando..." : "Criar"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Batalhas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="text-center text-muted-foreground py-8">Carregando...</div>
            ) : battles.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">Nenhuma batalha. Crie uma!</div>
            ) : battles.map((b: any) => {
              const subjectName = ALL_SUBJECTS.find(s => s.id === b.subject)?.name || b.subject;
              return (
                <div key={b.id} className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className="flex-1">
                    <div className="font-medium">
                      {b.challenger_name} {b.opponent_name ? `vs ${b.opponent_name}` : "(aguardando...)"}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                      <Clock className="h-3 w-3" />
                      {new Date(b.created_at).toLocaleDateString("pt-BR")}
                      <Badge variant="outline" className="text-xs">{subjectName}</Badge>
                      {b.status === "completed" && (
                        <span className="text-xs">{b.challenger_score} × {b.opponent_score}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {b.status === "pending" && b.challenger_key !== userKey && (
                      <Button size="sm" onClick={() => handleJoin(b)}>Aceitar</Button>
                    )}
                    {b.status === "completed" && (
                      <Badge variant={b.winner_key === userKey ? "default" : b.winner_key === "draw" ? "secondary" : "destructive"}>
                        {b.winner_key === userKey ? "Vitória!" : b.winner_key === "draw" ? "Empate" : "Derrota"}
                      </Badge>
                    )}
                    {b.status === "pending" && b.challenger_key === userKey && (
                      <Badge variant="outline">Aguardando</Badge>
                    )}
                    {b.status === "active" && (
                      <Button size="sm" onClick={() => startPlay(b)}>Jogar</Button>
                    )}
                    {(b.challenger_key === userKey || b.status === "completed") && (
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(b.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
