import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

const SUPABASE_URL = "https://juxdfkzaxhunvekjfybp.supabase.co";
const GAMIFICATION_URL = `${SUPABASE_URL}/functions/v1/gamification`;
const USER_KEY_STORAGE = "epistemologia_user_key";

async function callGamification(action: string, params: Record<string, any> = {}) {
  const res = await fetch(GAMIFICATION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...params }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

export function useUserKey(): string | null {
  const { role, isAuthenticated } = useAuth();
  if (!isAuthenticated) return null;
  if (role === "admin") return "ADMIN";
  return localStorage.getItem(USER_KEY_STORAGE);
}

export interface StudentProfile {
  user_key: string;
  display_name: string;
  xp: number;
  level: number;
  streak_days: number;
  last_study_date: string | null;
  total_study_minutes: number;
  learning_style: string;
  turma: string | null;
}

export function useProfile() {
  const userKey = useUserKey();
  const { name } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userKey) return;
    try {
      const res = await callGamification("get_or_create_profile", { user_key: userKey, display_name: name || "Estudante" });
      setProfile(res.profile);
    } catch (e) {
      console.error("Profile error:", e);
    } finally {
      setLoading(false);
    }
  }, [userKey, name]);

  useEffect(() => { refresh(); }, [refresh]);

  return { profile, loading, refresh, setProfile };
}

export function useRanking(turma?: string) {
  const [ranking, setRanking] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params: any = {};
    if (turma) params.turma = turma;
    callGamification("get_ranking", params).then(r => setRanking(r.ranking || [])).catch(console.error).finally(() => setLoading(false));
  }, [turma]);

  return { ranking, loading };
}

export function useBrainMap() {
  const userKey = useUserKey();
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userKey) return;
    callGamification("get_brain_map", { user_key: userKey }).then(r => setTopics(r.topics || [])).catch(console.error).finally(() => setLoading(false));
  }, [userKey]);

  return { topics, loading };
}

export function useErrors() {
  const userKey = useUserKey();
  const [errors, setErrors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userKey) return;
    callGamification("get_errors", { user_key: userKey }).then(r => setErrors(r.errors || [])).catch(console.error).finally(() => setLoading(false));
  }, [userKey]);

  return { errors, loading };
}

export function useDailyMissions() {
  const userKey = useUserKey();
  const [missions, setMissions] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userKey) return;
    callGamification("get_daily_missions", { user_key: userKey }).then(r => setMissions(r.missions)).catch(console.error).finally(() => setLoading(false));
  }, [userKey]);

  return { missions, loading };
}

export async function recordAnswer(userKey: string, data: {
  grade: string; subject: string; topic: string; correct: boolean;
  response_time_ms?: number; question_text?: string; wrong_answer?: string; correct_answer?: string;
}) {
  return callGamification("record_answer", { user_key: userKey, ...data });
}

export async function addXP(userKey: string, amount: number, reason?: string) {
  return callGamification("add_xp", { user_key: userKey, amount, reason });
}

export async function recordStudySession(userKey: string, data: {
  grade?: string; subject?: string; topic?: string; duration_minutes: number; session_type?: string;
}) {
  return callGamification("record_study_session", { user_key: userKey, ...data });
}

export async function getGradePrediction(userKey: string) {
  return callGamification("get_grade_prediction", { user_key: userKey });
}

export async function reportExam(userKey: string, data: {
  grade: string; subject: string; topics_appeared: string[]; difficulty: number; notes?: string;
}) {
  return callGamification("report_exam", { user_key: userKey, ...data });
}

export async function getExamRadar(grade: string, subject: string) {
  return callGamification("get_exam_radar", { grade, subject });
}

export async function getClassBrain(grade: string, subject: string) {
  return callGamification("get_class_brain", { grade, subject });
}

export async function createBattle(challengerKey: string, challengerName: string, subject: string, questions: any[]) {
  return callGamification("create_battle", { challenger_key: challengerKey, challenger_name: challengerName, subject, questions });
}

export async function getBattles(userKey: string) {
  return callGamification("get_battles", { user_key: userKey });
}

export async function deleteBattle(battleId: string, userKey: string) {
  return callGamification("delete_battle", { battle_id: battleId, user_key: userKey });
}

export async function joinBattle(battleId: string, opponentKey: string, opponentName: string) {
  return callGamification("join_battle", { battle_id: battleId, opponent_key: opponentKey, opponent_name: opponentName });
}

export async function submitBattleScore(battleId: string, userKey: string, score: number) {
  return callGamification("submit_battle_score", { battle_id: battleId, user_key: userKey, score });
}

export async function updateProfile(userKey: string, data: { display_name?: string; turma?: string }) {
  return callGamification("update_profile", { user_key: userKey, ...data });
}

export async function getAllStudents() {
  return callGamification("get_all_students");
}

export async function getStudentsByTurma(turma: string) {
  return callGamification("get_students_by_turma", { turma });
}

export async function getTurmaStats(turma: string) {
  return callGamification("get_turma_stats", { turma });
}

export async function getStudentDetail(userKey: string) {
  return callGamification("get_student_detail", { user_key: userKey });
}
