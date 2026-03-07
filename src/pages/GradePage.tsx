import { useParams, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Breadcrumbs from "@/components/Breadcrumbs";
import SubjectCard from "@/components/SubjectCard";
import { getGrade } from "@/data/curriculum";

const GradePage = () => {
  const { gradeId } = useParams<{ gradeId: string }>();
  const grade = getGrade(gradeId || "");

  if (!grade) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-6">
        <Breadcrumbs items={[{ label: grade.name }]} />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <h1 className="text-3xl font-bold font-display text-foreground mb-1">
            {grade.name}
          </h1>
          <p className="text-muted-foreground mb-8">
            {grade.level} — {grade.subjects.length} disciplinas disponíveis
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {grade.subjects.map((subject, index) => (
              <SubjectCard
                key={subject.id}
                subject={subject}
                gradeId={grade.id}
                topicCount={grade.topics[subject.id]?.length || 0}
                index={index}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default GradePage;
