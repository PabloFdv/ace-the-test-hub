import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, GraduationCap, Flag, Wrench } from "lucide-react";
import type { Grade } from "@/data/curriculum";

interface GradeCardProps {
  grade: Grade;
  index: number;
}

const GradeCard = ({ grade, index }: GradeCardProps) => {
  const isEM = grade.level === "Ensino Médio";
  const isSpecial = grade.level === "Formação Especial";
  const isTecnica = grade.level === "Formação Técnica";

  const getIcon = () => {
    if (isSpecial) return <Flag className="h-5 w-5" />;
    if (isTecnica) return <Wrench className="h-5 w-5" />;
    if (isEM) return <GraduationCap className="h-5 w-5" />;
    return <BookOpen className="h-5 w-5" />;
  };

  const getColorClass = () => {
    if (isSpecial) return "bg-success/15 text-success";
    if (isTecnica) return "bg-accent/15 text-accent";
    if (isEM) return "bg-accent/15 text-accent";
    return "bg-primary/10 text-primary";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
    >
      <Link
        to={`/${grade.id}`}
        className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1 hover:border-primary/30"
      >
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${getColorClass()}`}>
            {getIcon()}
          </div>
          <div>
            <h3 className="font-display font-bold text-foreground group-hover:text-primary transition-colors">
              {grade.name}
            </h3>
            <p className="text-xs text-muted-foreground">{grade.level}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {grade.subjects.length} disciplinas · {Object.values(grade.topics).flat().length} tópicos
        </p>
      </Link>
    </motion.div>
  );
};

export default GradeCard;
