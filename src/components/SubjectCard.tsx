import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { Subject } from "@/data/curriculum";

interface SubjectCardProps {
  subject: Subject;
  gradeId: string;
  topicCount: number;
  index: number;
}

const SubjectCard = ({ subject, gradeId, topicCount, index }: SubjectCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
    >
      <Link
        to={`/${gradeId}/${subject.id}`}
        className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5 hover:border-primary/30"
      >
        <span className="text-2xl">{subject.icon}</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
            {subject.name}
          </h3>
          <p className="text-xs text-muted-foreground">
            {topicCount} {topicCount === 1 ? 'tópico' : 'tópicos'}
          </p>
        </div>
      </Link>
    </motion.div>
  );
};

export default SubjectCard;
