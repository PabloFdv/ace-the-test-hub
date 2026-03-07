import { useState } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import { useRanking, useProfile } from "@/hooks/useGamification";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Medal, Flame } from "lucide-react";
import { TURMAS } from "@/lib/constants";

export default function RankingPage() {
  const [selectedTurma, setSelectedTurma] = useState<string>("");
  const { ranking, loading } = useRanking(selectedTurma || undefined);
  const { profile } = useProfile();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto p-4 md:p-6 max-w-2xl space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Trophy className="h-8 w-8 text-yellow-500" />
            Ranking
          </h1>
          <p className="text-muted-foreground mt-1">Os melhores estudantes da plataforma</p>
        </motion.div>

        {/* Turma filter */}
        <Select value={selectedTurma} onValueChange={(v) => setSelectedTurma(v === "all" ? "" : v)}>
          <SelectTrigger className="max-w-64"><SelectValue placeholder="Todas as turmas" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as turmas</SelectItem>
            {TURMAS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Podium */}
        {ranking.length >= 3 && (
          <div className="flex items-end justify-center gap-3 py-6">
            {[ranking[1], ranking[0], ranking[2]].map((r, i) => {
              const pos = i === 0 ? 2 : i === 1 ? 1 : 3;
              const heights = { 1: "h-32", 2: "h-24", 3: "h-20" };
              const colors = { 1: "bg-yellow-500", 2: "bg-gray-400", 3: "bg-amber-700" };
              return (
                <motion.div key={pos} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: pos * 0.1 }}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="text-center">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold mx-auto">
                      {r.display_name?.[0] || "?"}
                    </div>
                    <div className="text-sm font-medium mt-1 truncate max-w-20">{r.display_name}</div>
                    <div className="text-xs text-muted-foreground">{r.xp} XP</div>
                  </div>
                  <div className={`${heights[pos as 1|2|3]} w-20 ${colors[pos as 1|2|3]} rounded-t-lg flex items-center justify-center text-white text-2xl font-bold`}>
                    {pos}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Full List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Classificação Geral</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <div className="text-center text-muted-foreground py-8">Carregando...</div>
            ) : ranking.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">Nenhum estudante registrado ainda.</div>
            ) : ranking.map((r: any, i: number) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                className={`flex items-center gap-3 p-3 rounded-lg ${r.display_name === profile?.display_name ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/50"}`}
              >
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${i < 3 ? "bg-yellow-500/20 text-yellow-600" : "bg-muted text-muted-foreground"}`}>
                  {i < 3 ? <Medal className="h-4 w-4" /> : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{r.display_name}</div>
                  <div className="text-xs text-muted-foreground">Nível {r.level} {r.turma ? `• ${r.turma}` : ""}</div>
                </div>
                {r.streak_days > 0 && (
                  <Badge variant="outline" className="gap-1 text-xs">
                    <Flame className="h-3 w-3 text-orange-500" />
                    {r.streak_days}
                  </Badge>
                )}
                <span className="font-bold text-primary">{r.xp?.toLocaleString()} XP</span>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
