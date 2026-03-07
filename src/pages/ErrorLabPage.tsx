import { motion } from "framer-motion";
import Header from "@/components/Header";
import { useErrors } from "@/hooks/useGamification";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, BookOpen, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function ErrorLabPage() {
  const { errors, loading } = useErrors();

  const groupedErrors: Record<string, any[]> = {};
  for (const err of errors) {
    const key = `${err.subject}`;
    if (!groupedErrors[key]) groupedErrors[key] = [];
    groupedErrors[key].push(err);
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto p-4 md:p-6 max-w-2xl space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-orange-500" />
            Laboratório de Erros
          </h1>
          <p className="text-muted-foreground mt-1">Seus erros são oportunidades de aprender!</p>
        </motion.div>

        {loading ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">Carregando...</CardContent></Card>
        ) : errors.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center space-y-4">
              <div className="text-5xl">🎉</div>
              <h2 className="text-xl font-bold">Nenhum erro registrado!</h2>
              <p className="text-muted-foreground">Continue estudando e seus erros aparecerão aqui para treino.</p>
              <Link to="/">
                <Button><BookOpen className="h-4 w-4 mr-2" />Ir estudar</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupedErrors).map(([subject, errs]) => (
            <motion.div key={subject} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg capitalize flex items-center gap-2">
                    {subject}
                    <Badge variant="destructive">{errs.length} erros</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {errs.map((err: any, i: number) => (
                    <div key={i} className="p-3 rounded-lg border border-destructive/20 bg-destructive/5 space-y-2">
                      <div className="font-medium text-sm">{err.question_text}</div>
                      <div className="flex gap-4 text-xs">
                        {err.wrong_answer && (
                          <span className="text-destructive">❌ Sua resposta: {err.wrong_answer}</span>
                        )}
                        {err.correct_answer && (
                          <span className="text-green-600">✅ Correto: {err.correct_answer}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Errou {err.error_count}x • {err.topic}</span>
                        <Badge variant="outline" className="text-xs gap-1">
                          <RefreshCw className="h-3 w-3" />
                          Treinar
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
