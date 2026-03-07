import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FileText } from "lucide-react";

interface TopicCardProps {
  topic: string;
  gradeId: string;
  subjectId: string;
  index: number;
}

const TopicCard = ({ topic, gradeId, subjectId, index }: TopicCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
    >
      <Link
        to={`/${gradeId}/${subjectId}/${encodeURIComponent(topic)}`}
        className="group flex items-center gap-3 rounded-lg border border-border bg-card p-4 shadow-card transition-all duration-300 hover:shadow-card-hover hover:border-primary/30"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
          <FileText className="h-4 w-4" />
        </div>
        <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
          {topic}
        </span>
      </Link>
    </motion.div>
  );
};

export default TopicCard;
