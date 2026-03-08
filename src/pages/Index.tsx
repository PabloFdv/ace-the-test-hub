import { motion } from "framer-motion";
import { BookOpen, GraduationCap, Sparkles, Target, MessageCircle, Swords, Zap, Trophy, Flame, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import GradeCard from "@/components/GradeCard";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { grades } from "@/data/curriculum";

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const Index = () => {
  const regularGrades = grades.filter(g => g.level === "Ensino Fundamental" || g.level === "Ensino Médio");
  const specialGrades = grades.filter(g => g.level === "Formação Especial" || g.level === "Formação Técnica");

  const quickActions = [
    { icon: Target, label: "Simulado", desc: "Teste seus conhecimentos", href: "/simulator", gradient: "from-blue-500 to-indigo-600" },
    { icon: Swords, label: "Batalha", desc: "Desafie amigos", href: "/battle", gradient: "from-red-500 to-rose-600" },
    { icon: Zap, label: "Desafio 30s", desc: "Responda rápido", href: "/challenge", gradient: "from-amber-500 to-orange-600" },
    { icon: MessageCircle, label: "Prof. IA", desc: "Tire dúvidas", href: "/chat", gradient: "from-emerald-500 to-green-600" },
    { icon: Trophy, label: "Ranking", desc: "Classificação", href: "/ranking", gradient: "from-purple-500 to-violet-600" },
    { icon: Sparkles, label: "Estudo IA", desc: "Auto estudo", href: "/auto-study", gradient: "from-cyan-500 to-blue-600" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden pb-16 pt-20">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-accent/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial="hidden"
            animate="show"
            variants={stagger}
          >
            <motion.span variants={fadeUp}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary mb-6 border border-primary/20"
            >
              <BookOpen className="h-3.5 w-3.5" />
              Plataforma de Ensino Profissional
            </motion.span>

            <motion.h1 variants={fadeUp}
              className="text-4xl md:text-5xl lg:text-6xl font-black font-display tracking-tight text-foreground mb-5 leading-tight"
            >
              Aprenda de forma{" "}
              <span className="text-gradient">inteligente</span>
              <br />
              e <span className="text-gradient">divertida</span>
            </motion.h1>

            <motion.p variants={fadeUp}
              className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10"
            >
              Aulas com IA, desafios, batalhas e ranking — tudo para você dominar todas as disciplinas do Ensino Médio.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-wrap gap-3 justify-center">
              <Link to="/dashboard">
                <Button size="lg" className="gap-2 text-base h-12 px-6 shadow-glow hover:shadow-glow transition-shadow">
                  <GraduationCap className="h-5 w-5" />
                  Meu Painel
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/simulator">
                <Button size="lg" variant="outline" className="gap-2 text-base h-12 px-6 hover-lift">
                  <Target className="h-5 w-5" />
                  Fazer Simulado
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="container mx-auto px-4 -mt-6 mb-12">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={stagger}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3"
        >
          {quickActions.map((item, i) => (
            <motion.div key={i} variants={fadeUp}>
              <Link to={item.href}>
                <Card className="group hover-lift cursor-pointer border-border/50 overflow-hidden">
                  <CardContent className="p-4 text-center">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${item.gradient} mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <item.icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-sm font-semibold text-foreground">{item.label}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Stats bar */}
      <section className="container mx-auto px-4 mb-12">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-8 py-6 rounded-2xl glass">
          {[
            { value: "450+", label: "Questões" },
            { value: "10", label: "Disciplinas" },
            { value: "3", label: "Anos do EM" },
            { value: "∞", label: "Batalhas" },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-2xl md:text-3xl font-black text-gradient">{stat.value}</div>
              <div className="text-xs text-muted-foreground font-medium">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Grades */}
      <section className="container mx-auto px-4 pb-20">
        <motion.h2 initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
          className="text-2xl font-bold font-display text-foreground mb-6 flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          Séries e Disciplinas
        </motion.h2>
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={stagger}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          {regularGrades.map((grade, i) => (
            <motion.div key={grade.id} variants={fadeUp}>
              <GradeCard grade={grade} index={i} />
            </motion.div>
          ))}
        </motion.div>
        {specialGrades.length > 0 && (
          <>
            <motion.h2 initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="text-2xl font-bold font-display text-foreground mt-12 mb-6 flex items-center gap-2">
              <Flame className="h-6 w-6 text-accent" />
              Formações Especiais
            </motion.h2>
            <motion.div
              initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              {specialGrades.map((grade, i) => (
                <motion.div key={grade.id} variants={fadeUp}>
                  <GradeCard grade={grade} index={i} />
                </motion.div>
              ))}
            </motion.div>
          </>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            Feito com 💜 por <span className="font-semibold text-foreground">Pablo Martins</span> • Epistemologia © 2025
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;