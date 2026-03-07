import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import { useUserKey, recordAnswer, addXP } from "@/hooks/useGamification";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target, CheckCircle, Clock, Trophy, ArrowRight, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ALL_SUBJECTS, GRADES, getQuestions, type QuestionItem } from "@/lib/constants";

export default function SimulatorPage() {
  const userKey = useUserKey();
  const { toast } = useToast();
  const [subject, setSubject] = useState("matematica");
  const [grade, setGrade] = useState("1em");
  const [numQuestions, setNumQuestions] = useState("10");
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<{ correct: boolean; selected: string; time: number }[]>([]);
  const [finished, setFinished] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [timer, setTimer] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer
  useEffect(() => {
    if (questions.length > 0 && !finished) {
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [questions.length, finished]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const handleStart = () => {
    const count = parseInt(numQuestions);
    const qs = getQuestions(subject, grade, count);
    if (qs.length === 0) {
      toast({ title: "Sem questões disponíveis para essa combinação", variant: "destructive" });
      return;
    }
    setQuestions(qs);
    setCurrentQ(0);
    setAnswers([]);
    setFinished(false);
    setAnswered(false);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setTimer(0);
    setQuestionStartTime(Date.now());
  };

  const handleAnswer = (answer: string) => {
    if (answered) return;
    setAnswered(true);
    setSelectedAnswer(answer);
    const q = questions[currentQ];
    const correct = answer === q.correct;
    const responseTime = Date.now() - questionStartTime;
    const newAnswer = { correct, selected: answer, time: responseTime };
    const newAnswers = [...answers, newAnswer];
    setAnswers(newAnswers);

    if (userKey) {
      recordAnswer(userKey, {
        grade: grade,
        subject,
        topic: "Simulado",
        correct,
        response_time_ms: responseTime,
        question_text: q.q,
        wrong_answer: correct ? undefined : answer,
        correct_answer: q.correct,
      });
    }
  };

  const handleNext = () => {
    if (currentQ + 1 < questions.length) {
      setCurrentQ(c => c + 1);
      setAnswered(false);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setQuestionStartTime(Date.now());
    } else {
      setFinished(true);
      if (timerRef.current) clearInterval(timerRef.current);
      const totalCorrect = [...answers].filter(a => a.correct).length;
      if (userKey) addXP(userKey, totalCorrect * 15 + 25, "simulado");
    }
  };

  const handleReset = () => {
    setQuestions([]);
    setFinished(false);
    setCurrentQ(0);
    setAnswers([]);
    setAnswered(false);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setTimer(0);
  };

  // Results screen
  if (finished) {
    const totalCorrect = answers.filter(a => a.correct).length;
    const gradeScore = (totalCorrect / questions.length) * 10;
    const subjectName = ALL_SUBJECTS.find(s => s.id === subject)?.name || subject;
    const gradeName = GRADES.find(g => g.id === grade)?.name || grade;
    const avgTime = Math.round(answers.reduce((s, a) => s + a.time, 0) / answers.length / 1000);

    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto p-4 md:p-6 max-w-2xl space-y-6">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="text-center">
              <CardContent className="p-8 space-y-6">
                <div className="text-6xl">{gradeScore >= 7 ? "🎉" : gradeScore >= 5 ? "😊" : "😅"}</div>
                <h2 className="text-3xl font-bold">Simulado de {subjectName}</h2>
                <Badge variant="outline">{gradeName}</Badge>
                <div className="text-5xl font-bold text-primary">{gradeScore.toFixed(1)}</div>
                <div className="text-muted-foreground">Nota estimada</div>
                <div className="flex justify-center gap-8">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">{totalCorrect}</div>
                    <div className="text-xs text-muted-foreground">Acertos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-500">{questions.length - totalCorrect}</div>
                    <div className="text-xs text-muted-foreground">Erros</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-500">{formatTime(timer)}</div>
                    <div className="text-xs text-muted-foreground">Tempo</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-500">{avgTime}s</div>
                    <div className="text-xs text-muted-foreground">Média/questão</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Review answers */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Revisão das Respostas</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {questions.map((q, i) => (
                <div key={i} className={`p-4 rounded-lg border ${answers[i]?.correct ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"}`}>
                  <div className="flex items-start gap-2 mb-2">
                    <span className={`text-sm font-bold ${answers[i]?.correct ? "text-green-500" : "text-red-500"}`}>
                      {answers[i]?.correct ? "✓" : "✗"} Q{i + 1}
                    </span>
                    <span className="text-sm">{q.q}</span>
                  </div>
                  {!answers[i]?.correct && (
                    <div className="text-xs space-y-1 ml-6">
                      <div className="text-red-500">Sua resposta: {answers[i]?.selected}</div>
                      <div className="text-green-500">Resposta correta: {q.correct}</div>
                    </div>
                  )}
                  {q.explanation && (
                    <div className="text-xs text-muted-foreground mt-2 ml-6 italic">{q.explanation}</div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Button onClick={handleReset} className="w-full" size="lg">
            <RotateCcw className="h-4 w-4 mr-2" />Novo Simulado
          </Button>
        </div>
      </div>
    );
  }

  // Question screen
  if (questions.length > 0) {
    const q = questions[currentQ];
    const progressPercent = ((currentQ + (answered ? 1 : 0)) / questions.length) * 100;
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto p-4 md:p-6 max-w-xl">
          <div className="flex justify-between items-center mb-4">
            <Badge variant="outline">Questão {currentQ + 1}/{questions.length}</Badge>
            <div className="flex items-center gap-2">
              <Badge className="gap-1"><CheckCircle className="h-3 w-3" />{answers.filter(a => a.correct).length}</Badge>
              <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />{formatTime(timer)}</Badge>
            </div>
          </div>
          <Progress value={progressPercent} className="h-2 mb-6" />

          <motion.div key={currentQ} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-bold mb-6">{q.q}</h2>
                <div className="space-y-3">
                  {q.options.map((opt, i) => {
                    const isCorrect = opt === q.correct;
                    return (
                      <Button
                        key={i}
                        variant={answered ? (isCorrect ? "default" : opt === selectedAnswer ? "destructive" : "outline") : "outline"}
                        className="w-full justify-start h-auto py-3 text-left"
                        onClick={() => handleAnswer(opt)}
                        disabled={answered}
                      >
                        <span className="mr-2 font-bold">{String.fromCharCode(65 + i)}.</span>
                        {opt}
                      </Button>
                    );
                  })}
                </div>

                {answered && q.explanation && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4">
                    <Button variant="ghost" size="sm" className="text-xs mb-2" onClick={() => setShowExplanation(!showExplanation)}>
                      {showExplanation ? "Ocultar" : "Ver"} explicação
                    </Button>
                    {showExplanation && (
                      <div className="p-3 rounded-lg bg-muted text-sm text-muted-foreground">{q.explanation}</div>
                    )}
                  </motion.div>
                )}

                {answered && (
                  <Button className="w-full mt-4" onClick={handleNext}>
                    {currentQ + 1 < questions.length ? (
                      <>Próxima <ArrowRight className="h-4 w-4 ml-2" /></>
                    ) : (
                      <>Finalizar <Trophy className="h-4 w-4 ml-2" /></>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // Setup screen
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto p-4 md:p-6 max-w-xl space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Target className="h-8 w-8 text-blue-500" />
            Simulador de Prova
          </h1>
          <p className="text-muted-foreground mt-1">Teste seus conhecimentos com questões de todas as disciplinas</p>
        </motion.div>

        <Card>
          <CardHeader><CardTitle>Configurar Simulado</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Ano Escolar</label>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GRADES.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Disciplina</label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ALL_SUBJECTS.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Quantidade de Questões</label>
              <Select value={numQuestions} onValueChange={setNumQuestions}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 questões</SelectItem>
                  <SelectItem value="10">10 questões</SelectItem>
                  <SelectItem value="15">15 questões (todas)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleStart} className="w-full" size="lg">
              🚀 Começar Simulado
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
