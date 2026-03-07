import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import { useUserKey, useProfile, addXP, recordAnswer } from "@/hooks/useGamification";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, Timer, Trophy, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ALL_SUBJECTS, getRandomQuestions, type QuestionItem } from "@/lib/constants";

export default function ChallengePage() {
  const userKey = useUserKey();
  const { profile } = useProfile();
  const { toast } = useToast();
  const [subject, setSubject] = useState("matematica");
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (playing && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    } else if (playing && timeLeft <= 0) {
      endGame();
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [playing, timeLeft]);

  const startGame = () => {
    const qs = getRandomQuestions(subject, 50);
    if (qs.length === 0) {
      toast({ title: "Sem questões disponíveis", variant: "destructive" });
      return;
    }
    setQuestions(qs);
    setCurrentQ(0);
    setScore(0);
    setTotalAnswered(0);
    setTimeLeft(30);
    setPlaying(true);
    setFinished(false);
  };

  const endGame = () => {
    setPlaying(false);
    setFinished(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (userKey && score > 0) {
      addXP(userKey, score * 5 + 10, "desafio_30s");
    }
    toast({ title: `⚡ Desafio finalizado!`, description: `Você acertou ${score} questões em 30 segundos!` });
  };

  const handleAnswer = (answer: string) => {
    if (!playing) return;
    const q = questions[currentQ];
    const correct = answer === q.correct;
    if (correct) setScore(s => s + 1);
    setTotalAnswered(t => t + 1);

    if (userKey) {
      recordAnswer(userKey, { grade: "1em", subject, topic: "Desafio 30s", correct, question_text: q.q });
    }

    if (currentQ + 1 < questions.length) {
      setCurrentQ(c => c + 1);
    } else {
      endGame();
    }
  };

  if (finished) {
    const subjectName = ALL_SUBJECTS.find(s => s.id === subject)?.name || subject;
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto p-4 md:p-6 max-w-xl space-y-6">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="text-center">
              <CardContent className="p-8 space-y-4">
                <div className="text-6xl">⚡</div>
                <h2 className="text-3xl font-bold">Desafio 30s — {subjectName}</h2>
                <div className="text-6xl font-bold text-primary">{score}</div>
                <div className="text-muted-foreground">acertos em 30 segundos</div>
                <div className="flex justify-center gap-6">
                  <div className="text-center">
                    <div className="text-xl font-bold">{totalAnswered}</div>
                    <div className="text-xs text-muted-foreground">Respondidas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-500">{totalAnswered > 0 ? Math.round((score / totalAnswered) * 100) : 0}%</div>
                    <div className="text-xs text-muted-foreground">Precisão</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-primary">+{score * 5 + 10}</div>
                    <div className="text-xs text-muted-foreground">XP ganho</div>
                  </div>
                </div>
                <div className="flex gap-3 justify-center mt-4">
                  <Button onClick={startGame}><RotateCcw className="h-4 w-4 mr-2" />Jogar de Novo</Button>
                  <Button variant="outline" onClick={() => setFinished(false)}>Voltar</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  if (playing) {
    const q = questions[currentQ];
    if (!q) return null;
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto p-4 md:p-6 max-w-xl">
          <div className="flex justify-between items-center mb-4">
            <Badge variant="outline" className="gap-1 text-lg px-3 py-1">
              <Timer className="h-4 w-4" />{timeLeft}s
            </Badge>
            <Badge className="gap-1 text-lg px-3 py-1">
              <Trophy className="h-4 w-4" />{score}
            </Badge>
          </div>
          <Progress value={(timeLeft / 30) * 100} className="h-3 mb-6" />

          <motion.div key={currentQ} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.15 }}>
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-6">{q.q}</h2>
                <div className="grid grid-cols-2 gap-3">
                  {q.options.map((opt, i) => (
                    <Button key={i} variant="outline" className="h-16 text-base font-medium" onClick={() => handleAnswer(opt)}>
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

  // Setup
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto p-4 md:p-6 max-w-xl space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Zap className="h-8 w-8 text-yellow-500" />
            Desafio 30 Segundos
          </h1>
          <p className="text-muted-foreground mt-1">Responda o máximo de questões em 30 segundos!</p>
        </motion.div>

        <Card>
          <CardHeader><CardTitle>Escolha a Matéria</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ALL_SUBJECTS.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={startGame} className="w-full" size="lg">
              ⚡ Começar Desafio
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
