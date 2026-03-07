import { motion } from "framer-motion";
import { BookOpen, GraduationCap, Sparkles, Target, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import GradeCard from "@/components/GradeCard";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { grades } from "@/data/curriculum";

const Index = () => {
  const regularGrades = grades.filter(g => g.level === "Ensino Fundamental" || g.level === "Ensino Médio");
  const specialGrades = grades.filter(g => g.level === "Formação Especial" || g.level === "Formação Técnica");

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background pb-12 pt-16">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-6">
              <BookOpen className="h-3.5 w-3.5" />
              Baseado na BNCC
            </span>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-display tracking-tight text-foreground mb-4">
              Estude{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                todas as disciplinas
              </span>
              <br />
              do 6º ano ao Ensino Médio
            </h1>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Aulas geradas por IA com exemplos reais, analogias e exercícios interativos.
            </p>

            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/dashboard">
                <Button size="lg" className="gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Meu Painel
                </Button>
              </Link>
              <Link to="/chat">
                <Button size="lg" variant="outline" className="gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Prof. IA
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="container mx-auto px-4 -mt-4 mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Target, label: "Simulado", href: "/simulator", color: "text-primary" },
            { icon: Sparkles, label: "Estudo Rápido", href: "/auto-study?mode=quick", color: "text-accent" },
            { icon: GraduationCap, label: "Ranking", href: "/ranking", color: "text-primary" },
            { icon: MessageCircle, label: "Chat IA", href: "/chat", color: "text-accent" },
          ].map((item, i) => (
            <Link key={i} to={item.href}
              className="flex items-center gap-2 rounded-lg border border-border bg-card p-3 hover:bg-muted transition-colors">
              <item.icon className={`h-4 w-4 ${item.color}`} />
              <span className="text-sm font-medium text-foreground">{item.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Grades */}
      <section className="container mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold font-display text-foreground mb-6">
          Séries e Disciplinas
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {regularGrades.map((grade, i) => (
            <GradeCard key={grade.id} grade={grade} index={i} />
          ))}
        </div>
        {specialGrades.length > 0 && (
          <>
            <h2 className="text-2xl font-bold font-display text-foreground mt-10 mb-6">
              Formações Especiais
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {specialGrades.map((grade, i) => (
                <GradeCard key={grade.id} grade={grade} index={i} />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default Index;
