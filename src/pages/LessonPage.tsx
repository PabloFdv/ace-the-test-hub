import { useParams, Navigate, Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Sparkles, BookOpen, ClipboardList, MessageCircle } from "lucide-react";
import Header from "@/components/Header";
import Breadcrumbs from "@/components/Breadcrumbs";
import LessonContent from "@/components/LessonContent";
import ExerciseSection, { type Question } from "@/components/ExerciseSection";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { getGrade, getSubject } from "@/data/curriculum";
import { useToast } from "@/hooks/use-toast";

const LessonPage = () => {
  const { gradeId, subjectId, topic } = useParams<{
    gradeId: string;
    subjectId: string;
    topic: string;
  }>();
  const decodedTopic = decodeURIComponent(topic || "");
  const grade = getGrade(gradeId || "");
  const subject = getSubject(gradeId || "", subjectId || "");
  const { toast } = useToast();

  const [lessonContent, setLessonContent] = useState("");
  const [isLoadingLesson, setIsLoadingLesson] = useState(true);
  const [exercises, setExercises] = useState<Question[]>([]);
  const [isLoadingExercises, setIsLoadingExercises] = useState(false);
  const [activeTab, setActiveTab] = useState("aula");
  const streamedRef = useRef("");

  useEffect(() => {
    if (!grade || !subject || !decodedTopic) return;
    loadLesson();
  }, [gradeId, subjectId, topic]);

  const loadLesson = async () => {
    setIsLoadingLesson(true);
    setLessonContent("");
    streamedRef.current = "";

    try {
      // Check cache first
      const { data: cached } = await supabase
        .from("lessons")
        .select("id, content")
        .eq("grade", gradeId!)
        .eq("subject", subjectId!)
        .eq("topic", decodedTopic)
        .maybeSingle();

      if (cached?.content) {
        setLessonContent(cached.content);
        setIsLoadingLesson(false);
        return;
      }

      // Stream from AI
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-lesson`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            grade: grade!.name,
            subject: subject!.name,
            topic: decodedTopic,
            gradeId: gradeId,
            subjectId: subjectId,
          }),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Falha ao gerar aula");
      }

      if (!response.body) throw new Error("No stream");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              streamedRef.current += content;
              setLessonContent(streamedRef.current);
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      setIsLoadingLesson(false);
    } catch (err: any) {
      console.error("Lesson error:", err);
      toast({
        title: "Erro ao gerar aula",
        description: err.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
      setIsLoadingLesson(false);
    }
  };

  const loadExercises = async () => {
    if (exercises.length > 0) return;
    setIsLoadingExercises(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-exercises", {
        body: {
          grade: grade!.name,
          subject: subject!.name,
          topic: decodedTopic,
          gradeId: gradeId,
          subjectId: subjectId,
        },
      });

      if (error) throw error;
      if (data?.questions) {
        setExercises(data.questions);
      }
    } catch (err: any) {
      console.error("Exercises error:", err);
      toast({
        title: "Erro ao gerar exercícios",
        description: "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingExercises(false);
    }
  };

  if (!grade || !subject) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto max-w-4xl px-4 py-6">
        <Breadcrumbs
          items={[
            { label: grade.name, href: `/${grade.id}` },
            { label: subject.name, href: `/${grade.id}/${subject.id}` },
            { label: decodedTopic },
          ]}
        />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <div className="flex items-start gap-3 mb-6">
            <span className="text-3xl mt-1">{subject.icon}</span>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-display text-foreground">
                {decodedTopic}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {subject.name} — {grade.name}
              </p>
              <Link
                to={`/chat?context=${encodeURIComponent(`${decodedTopic} - ${subject.name} - ${grade.name}`)}`}
                className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium text-primary hover:underline"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Perguntar ao Professor IA
              </Link>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => {
            setActiveTab(v);
            if (v === "exercicios") loadExercises();
          }}>
            <TabsList className="mb-6">
              <TabsTrigger value="aula" className="gap-2">
                <BookOpen className="h-4 w-4" />
                Aula
              </TabsTrigger>
              <TabsTrigger value="exercicios" className="gap-2">
                <ClipboardList className="h-4 w-4" />
                Exercícios
              </TabsTrigger>
            </TabsList>

            <TabsContent value="aula">
              {isLoadingLesson && !lessonContent ? (
                <LoadingSkeleton />
              ) : (
                <div className="rounded-xl border border-border bg-card p-6 md:p-8 shadow-card">
                  <LessonContent content={lessonContent} />
                  {isLoadingLesson && (
                    <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                      <Sparkles className="h-4 w-4 animate-pulse text-primary" />
                      Gerando conteúdo...
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="exercicios">
              {isLoadingExercises ? (
                <LoadingSkeleton message="Gerando exercícios..." />
              ) : exercises.length > 0 ? (
                <ExerciseSection questions={exercises} />
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Clique na aba para gerar exercícios sobre este tópico.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default LessonPage;
