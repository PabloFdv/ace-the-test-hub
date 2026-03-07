import { useParams, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Breadcrumbs from "@/components/Breadcrumbs";
import TopicCard from "@/components/TopicCard";
import { getGrade, getSubject, getTopics } from "@/data/curriculum";

const SubjectPage = () => {
  const { gradeId, subjectId } = useParams<{ gradeId: string; subjectId: string }>();
  const grade = getGrade(gradeId || "");
  const subject = getSubject(gradeId || "", subjectId || "");
  const topics = getTopics(gradeId || "", subjectId || "");

  if (!grade || !subject) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-6">
        <Breadcrumbs
          items={[
            { label: grade.name, href: `/${grade.id}` },
            { label: subject.name },
          ]}
        />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <div className="flex items-center gap-3 mb-1">
            <span className="text-3xl">{subject.icon}</span>
            <h1 className="text-3xl font-bold font-display text-foreground">
              {subject.name}
            </h1>
          </div>
          <p className="text-muted-foreground mb-8">
            {grade.name} — {topics.length} tópicos disponíveis
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {topics.map((topic, index) => (
              <TopicCard
                key={topic}
                topic={topic}
                gradeId={grade.id}
                subjectId={subject.id}
                index={index}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SubjectPage;
