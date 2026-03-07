import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, RotateCcw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface Question {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

interface ExerciseSectionProps {
  questions: Question[];
}

const ExerciseSection = ({ questions }: ExerciseSectionProps) => {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);

  const handleSelect = (questionIndex: number, optionIndex: number) => {
    if (showResults) return;
    setAnswers(prev => ({ ...prev, [questionIndex]: optionIndex }));
  };

  const handleSubmit = () => {
    setShowResults(true);
  };

  const handleReset = () => {
    setAnswers({});
    setShowResults(false);
  };

  const correctCount = questions.reduce((acc, q, i) => {
    return acc + (answers[i] === q.correct ? 1 : 0);
  }, 0);

  const allAnswered = Object.keys(answers).length === questions.length;

  return (
    <div className="space-y-6">
      {showResults && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`flex items-center gap-3 rounded-xl p-4 border ${
            correctCount === questions.length
              ? "bg-success/10 border-success/30"
              : correctCount >= questions.length / 2
              ? "bg-accent/10 border-accent/30"
              : "bg-destructive/10 border-destructive/30"
          }`}
        >
          <Trophy className="h-6 w-6 text-foreground" />
          <div>
            <p className="font-semibold text-foreground">
              Você acertou {correctCount} de {questions.length} questões!
            </p>
            <p className="text-sm text-muted-foreground">
              {correctCount === questions.length
                ? "Parabéns! Desempenho perfeito! 🎉"
                : correctCount >= questions.length / 2
                ? "Bom trabalho! Continue estudando! 💪"
                : "Revise o conteúdo e tente novamente! 📚"}
            </p>
          </div>
        </motion.div>
      )}

      {questions.map((q, qIndex) => (
        <motion.div
          key={qIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: qIndex * 0.1 }}
          className="rounded-xl border border-border bg-card p-5 shadow-card"
        >
          <p className="font-semibold text-foreground mb-4">
            <span className="text-primary mr-2">{qIndex + 1}.</span>
            {q.question}
          </p>

          <div className="space-y-2">
            {q.options.map((option, oIndex) => {
              const isSelected = answers[qIndex] === oIndex;
              const isCorrect = q.correct === oIndex;
              const showCorrectness = showResults;

              let borderClass = "border-border";
              let bgClass = "bg-card hover:bg-muted/50";

              if (showCorrectness && isCorrect) {
                borderClass = "border-success/50";
                bgClass = "bg-success/10";
              } else if (showCorrectness && isSelected && !isCorrect) {
                borderClass = "border-destructive/50";
                bgClass = "bg-destructive/10";
              } else if (isSelected) {
                borderClass = "border-primary/50";
                bgClass = "bg-primary/5";
              }

              return (
                <button
                  key={oIndex}
                  onClick={() => handleSelect(qIndex, oIndex)}
                  className={`w-full flex items-center gap-3 rounded-lg border p-3 text-left text-sm transition-all ${borderClass} ${bgClass} ${!showResults ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border text-xs font-medium">
                    {String.fromCharCode(65 + oIndex)}
                  </span>
                  <span className="flex-1 text-foreground">{option}</span>
                  {showCorrectness && isCorrect && (
                    <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                  )}
                  {showCorrectness && isSelected && !isCorrect && (
                    <XCircle className="h-5 w-5 text-destructive shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          <AnimatePresence>
            {showResults && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 rounded-lg bg-muted p-3"
              >
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">Explicação: </span>
                  {q.explanation}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}

      <div className="flex gap-3">
        {!showResults ? (
          <Button
            onClick={handleSubmit}
            disabled={!allAnswered}
            className="w-full"
            size="lg"
          >
            Verificar Respostas
          </Button>
        ) : (
          <Button
            onClick={handleReset}
            variant="outline"
            className="w-full"
            size="lg"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        )}
      </div>
    </div>
  );
};

export default ExerciseSection;
