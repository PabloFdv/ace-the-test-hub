import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import { useUserKey, useBrainMap, recordAnswer, addXP, recordStudySession } from "@/hooks/useGamification";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Zap, Brain, Timer, CheckCircle, Loader2, Play, Pause } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AutoStudyPage() {
  const [searchParams] = useSearchParams();
  const isQuickMode = searchParams.get("mode") === "quick";
  const userKey = useUserKey();
  const { topics: brainTopics } = useBrainMap();
  const { toast } = useToast();

  const [studying, setStudying] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(false);

  // Focus timer
  const [focusActive, setFocusActive] = useState(false);
  const [focusSeconds, setFocusSeconds] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (focusActive) {
      timerRef.current = window.setInterval(() => setFocusSeconds(s => s + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [focusActive]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const startStudy = async () => {
    setLoading(true);
    // Pick a weak topic or random
    const weakTopics = brainTopics.filter(t => t.mastery_percent < 50);
    const targetSubject = weakTopics.length > 0 ? weakTopics[0].subject : "matematica";
    const targetTopic = weakTopics.length > 0 ? weakTopics[0].topic : "Exercícios gerais";

    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-exercises`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grade: "9ano", subject: targetSubject, topic: targetTopic,
          numQuestions: isQuickMode ? 3 : 8
        }),
      });
      const data = await res.json();
      if (data.questions?.length > 0) {
        setQuestions(data.questions);
        setStudying(true);
        setCurrentQ(0);
        setScore(0);
        setFinished(false);
        setFocusActive(true);
        setFocusSeconds(0);
      } else {
        toast({ title: "Erro ao gerar exercícios", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro de conexão", variant: "destructive" });
    }
    setLoading(false);
  };

  const handleAnswer = (answer: string) => {
    if (answered) return;
    setAnswered(true);
    setSelectedAnswer(answer);
    const q = questions[currentQ];
    const correct = answer === (q.correct || q.correctAnswer);
    if (correct) setScore(s => s + 1);

    if (userKey) {
      recordAnswer(userKey, {
        grade: "9ano", subject: q.subject || "geral", topic: q.topic || "auto-study",
        correct, question_text: q.question || q.text,
        wrong_answer: correct ? undefined : answer, correct_answer: q.correct || q.correctAnswer
      });
    }

    setTimeout(() => {
      if (currentQ + 1 < questions.length) {
        setCurrentQ(c => c + 1);
        setAnswered(false);
        setSelectedAnswer(null);
      } else {
        setFinished(true);
        setFocusActive(false);
        const finalScore = score + (correct ? 1 : 0);
        if (userKey) {
          addXP(userKey, finalScore * 10 + 15, "auto-study");
          recordStudySession(userKey, { duration_minutes: Math.ceil(focusSeconds / 60), session_type: isQuickMode ? "quick" : "auto" });
        }
      }
    }, 1200);
  };

  if (finished) {
    const total = questions.length;
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto p-4 md:p-6 max-w-xl">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="text-center">
              <CardContent className="p-8 space-y-4">
                <div className="text-5xl">{score >= total * 0.7 ? "🏆" : "💪"}</div>
                <h2 className="text-2xl font-bold">{isQuickMode ? "Estudo Rápido" : "Estudo Automático"} Completo!</h2>
                <div className="flex justify-center gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-500">{score}</div>
                    <div className="text-xs text-muted-foreground">Acertos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-muted-foreground">{formatTime(focusSeconds)}</div>
                    <div className="text-xs text-muted-foreground">Tempo</div>
                  </div>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button onClick={startStudy}>Estudar de Novo</Button>
                  <Button variant="outline" onClick={() => { setStudying(false); setQuestions([]); setFinished(false); }}>Voltar</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  if (studying && questions.length > 0) {
    const q = questions[currentQ];
    const opts = q.options || q.alternatives || [];
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto p-4 md:p-6 max-w-xl">
          <div className="flex justify-between items-center mb-4">
            <Badge variant="outline">{currentQ + 1}/{questions.length}</Badge>
            <Badge className="gap-1"><Timer className="h-3 w-3" />{formatTime(focusSeconds)}</Badge>
            <Badge variant="secondary" className="gap-1"><CheckCircle className="h-3 w-3" />{score}</Badge>
          </div>
          <Progress value={((currentQ + 1) / questions.length) * 100} className="h-2 mb-4" />
          <motion.div key={currentQ} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-bold mb-6">{q.question || q.text}</h2>
                <div className="space-y-3">
                  {opts.map((opt: any, i: number) => {
                    const optText = typeof opt === "string" ? opt : opt.text || opt.label;
                    const isCorrect = optText === (q.correct || q.correctAnswer);
                    return (
                      <Button key={i} variant={answered ? (isCorrect ? "default" : optText === selectedAnswer ? "destructive" : "outline") : "outline"}
                        className="w-full justify-start h-auto py-3 text-left" onClick={() => handleAnswer(optText)} disabled={answered}
                      >
                        <span className="mr-2 font-bold">{String.fromCharCode(65 + i)}.</span>{optText}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // Start screen
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto p-4 md:p-6 max-w-xl space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            {isQuickMode ? <Zap className="h-8 w-8 text-yellow-500" /> : <Brain className="h-8 w-8 text-purple-500" />}
            {isQuickMode ? "Estudo Rápido" : "Estudo Automático"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isQuickMode ? "3 perguntas em 2 minutos. Rápido e eficiente!" : "O sistema escolhe a melhor matéria e dificuldade para você."}
          </p>
        </motion.div>

        <Card className="text-center">
          <CardContent className="p-8 space-y-6">
            <div className="text-6xl">{isQuickMode ? "⚡" : "🧠"}</div>
            <div>
              <h2 className="text-xl font-bold">{isQuickMode ? "Sessão Ultra Curta" : "Estudo Inteligente"}</h2>
              <p className="text-muted-foreground text-sm mt-1">
                {isQuickMode ? "3 questões focadas nos seus pontos fracos" : "8 questões adaptadas ao seu nível"}
              </p>
            </div>
            {brainTopics.filter(t => t.mastery_percent < 50).length > 0 && (
              <div className="text-sm text-left bg-muted/50 rounded-lg p-3">
                <div className="font-medium mb-1">🎯 Foco recomendado:</div>
                {brainTopics.filter(t => t.mastery_percent < 50).slice(0, 3).map((t, i) => (
                  <div key={i} className="text-muted-foreground">• {t.topic} ({t.mastery_percent}% dominado)</div>
                ))}
              </div>
            )}
            <Button size="lg" onClick={startStudy} disabled={loading} className="w-full">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Preparando...</> : <><Play className="h-4 w-4 mr-2" />Começar</>}
            </Button>
          </CardContent>
        </Card>

        {/* Focus Timer */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Timer className="h-5 w-5 text-red-500" />
              Cronômetro de Foco
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="text-4xl font-mono font-bold">{formatTime(focusSeconds)}</div>
            <div className="flex gap-3 justify-center">
              <Button variant={focusActive ? "destructive" : "default"} onClick={() => setFocusActive(!focusActive)}>
                {focusActive ? <><Pause className="h-4 w-4 mr-2" />Pausar</> : <><Play className="h-4 w-4 mr-2" />Iniciar</>}
              </Button>
              <Button variant="outline" onClick={() => { setFocusActive(false); setFocusSeconds(0); }}>Resetar</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
