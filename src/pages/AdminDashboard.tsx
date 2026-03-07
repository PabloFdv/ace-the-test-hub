import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Plus, Trash2, Ban, RotateCcw, Copy, Check, LogOut, Key,
  ShieldCheck, Loader2, Unlock, Users, User, ChevronDown, MessageSquare, Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getAllStudents, getTurmaStats, getStudentDetail } from "@/hooks/useGamification";
import { TURMAS } from "@/lib/constants";
import { SUPABASE_URL } from "@/lib/supabase-config";

interface AccessKey {
  id: string; key: string; created_by: string; used: boolean;
  used_by: string | null; created_at: string; used_at: string | null; blocked: boolean;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const AdminDashboard = () => {
  const { role, adminKey, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [keys, setKeys] = useState<AccessKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [selectedTurma, setSelectedTurma] = useState<string>("");
  const [turmaStats, setTurmaStats] = useState<any>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [studentDetail, setStudentDetail] = useState<any>(null);
  const [studentsLoading, setStudentsLoading] = useState(false);

  // Admin Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "👋 Olá Pablo! Sou o assistente de manutenção do sistema. Relate um bug ou problema e tentarei corrigir automaticamente.\n\nExemplos:\n• \"Resetar XP do aluno João\"\n• \"Remover batalhas antigas\"\n• \"Verificar alunos sem turma\"\n• \"Listar todos os erros do sistema\"", timestamp: new Date() }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    if (role !== "admin") { navigate("/login"); return; }
    loadKeys();
    loadStudents();
  }, [role]);

  const loadStudents = async () => {
    setStudentsLoading(true);
    try {
      const res = await getAllStudents();
      setAllStudents(res.students || []);
    } catch (e) { console.error(e); }
    setStudentsLoading(false);
  };

  useEffect(() => {
    if (selectedTurma) {
      getTurmaStats(selectedTurma).then(r => setTurmaStats(r.stats)).catch(console.error);
    } else {
      setTurmaStats(null);
    }
  }, [selectedTurma]);

  const handleViewStudent = async (student: any) => {
    setSelectedStudent(student);
    try {
      const res = await getStudentDetail(student.user_key);
      setStudentDetail(res);
    } catch { setStudentDetail(null); }
  };

  const apiCall = async (action: string, keyId?: string) => {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-keys`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, adminKey, keyId }),
    });
    if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || "Erro"); }
    return res.json();
  };

  const loadKeys = async () => {
    try { const data = await apiCall("list"); setKeys(data.keys || []); }
    catch (e: any) { toast({ title: "Erro", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const generateKey = async () => {
    setGenerating(true);
    try {
      const data = await apiCall("generate");
      if (data.key) { setKeys(prev => [data.key, ...prev]); toast({ title: "Senha criada! 🔑", description: `Senha: ${data.key.key}` }); }
    } catch (e: any) { toast({ title: "Erro", description: e.message, variant: "destructive" }); }
    finally { setGenerating(false); }
  };

  const handleAction = async (action: string, keyId: string, label: string) => {
    try { await apiCall(action, keyId); toast({ title: `${label} com sucesso!` }); loadKeys(); }
    catch (e: any) { toast({ title: "Erro", description: e.message, variant: "destructive" }); }
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Admin Chat - Process commands
  const processAdminChat = async (message: string) => {
    setChatLoading(true);
    const userMsg: ChatMessage = { role: "user", content: message, timestamp: new Date() };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");

    let response = "";
    const lowerMsg = message.toLowerCase();

    try {
      // Analyze and auto-fix
      if (lowerMsg.includes("resetar xp") || lowerMsg.includes("reset xp") || lowerMsg.includes("zerar xp")) {
        const nameMatch = message.match(/(?:do|da|de)\s+(\w+)/i);
        if (nameMatch) {
          const studentName = nameMatch[1];
          const student = allStudents.find(s => s.display_name.toLowerCase().includes(studentName.toLowerCase()));
          if (student) {
            try {
              await fetch(`${SUPABASE_URL}/functions/v1/gamification`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "update_profile", user_key: student.user_key, xp: 0 }),
              });
              response = `✅ XP do aluno **${student.display_name}** foi resetado para 0.\n\nRecarregue os dados para ver a mudança.`;
              loadStudents();
            } catch {
              response = `❌ Erro ao resetar XP. O backend pode não suportar essa operação diretamente.`;
            }
          } else {
            response = `⚠️ Aluno com nome "${studentName}" não encontrado.\n\nAlunos disponíveis:\n${allStudents.map(s => `• ${s.display_name}`).join("\n")}`;
          }
        } else {
          response = "ℹ️ Especifique o aluno. Ex: \"Resetar XP do João\"";
        }
      } else if (lowerMsg.includes("sem turma") || lowerMsg.includes("alunos sem turma")) {
        const semTurma = allStudents.filter(s => !s.turma);
        if (semTurma.length > 0) {
          response = `📋 **${semTurma.length} aluno(s) sem turma:**\n${semTurma.map(s => `• ${s.display_name} (${s.user_key})`).join("\n")}\n\nSolicite ao aluno que selecione a turma no painel.`;
        } else {
          response = "✅ Todos os alunos já possuem turma definida!";
        }
      } else if (lowerMsg.includes("remover batalha") || lowerMsg.includes("limpar batalha")) {
        response = "🔄 Para limpar batalhas antigas, acesse a página de Batalha e use o botão de deletar. Batalhas completadas podem ser removidas pelo criador ou admin.\n\n⚠️ A remoção em massa requer acesso direto ao banco de dados Supabase.";
      } else if (lowerMsg.includes("listar aluno") || lowerMsg.includes("todos os aluno")) {
        const turmaGroups: Record<string, any[]> = {};
        allStudents.forEach(s => {
          const t = s.turma || "Sem turma";
          if (!turmaGroups[t]) turmaGroups[t] = [];
          turmaGroups[t].push(s);
        });
        response = `📊 **Total: ${allStudents.length} alunos**\n\n`;
        Object.entries(turmaGroups).forEach(([turma, students]) => {
          response += `**${turma}** (${students.length}):\n`;
          students.forEach(s => { response += `  • ${s.display_name} — Nível ${s.level}, ${s.xp} XP\n`; });
          response += "\n";
        });
      } else if (lowerMsg.includes("estatística") || lowerMsg.includes("resumo") || lowerMsg.includes("status do sistema")) {
        const totalXP = allStudents.reduce((s, a) => s + (a.xp || 0), 0);
        const avgXP = allStudents.length > 0 ? Math.round(totalXP / allStudents.length) : 0;
        const avgLevel = allStudents.length > 0 ? (allStudents.reduce((s, a) => s + (a.level || 1), 0) / allStudents.length).toFixed(1) : "0";
        const withTurma = allStudents.filter(s => s.turma).length;
        const activeToday = allStudents.filter(s => s.last_study_date === new Date().toISOString().split("T")[0]).length;
        response = `📊 **Status do Sistema**\n\n• Total de alunos: **${allStudents.length}**\n• XP total: **${totalXP}**\n• XP médio: **${avgXP}**\n• Nível médio: **${avgLevel}**\n• Com turma: **${withTurma}/${allStudents.length}**\n• Ativos hoje: **${activeToday}**`;
      } else if (lowerMsg.includes("ranking") || lowerMsg.includes("top aluno")) {
        const sorted = [...allStudents].sort((a, b) => (b.xp || 0) - (a.xp || 0)).slice(0, 10);
        response = `🏆 **Top 10 Alunos por XP:**\n\n`;
        sorted.forEach((s, i) => { response += `${i + 1}. ${s.display_name} — ${s.xp} XP (Nível ${s.level})\n`; });
      } else if (lowerMsg.includes("bug") || lowerMsg.includes("erro") || lowerMsg.includes("problema")) {
        response = `🔍 **Diagnóstico automático:**\n\n`;
        const issues: string[] = [];
        const semTurma = allStudents.filter(s => !s.turma);
        if (semTurma.length) issues.push(`⚠️ ${semTurma.length} aluno(s) sem turma`);
        const zeroXP = allStudents.filter(s => (s.xp || 0) === 0 && s.user_key !== "ADMIN");
        if (zeroXP.length) issues.push(`⚠️ ${zeroXP.length} aluno(s) com 0 XP`);
        const noStudy = allStudents.filter(s => !s.last_study_date);
        if (noStudy.length) issues.push(`⚠️ ${noStudy.length} aluno(s) nunca estudaram`);
        if (issues.length === 0) {
          response += "✅ Nenhum problema detectado! O sistema está funcionando normalmente.";
        } else {
          response += issues.join("\n") + "\n\nDescreva o bug específico e tentarei resolver!";
        }
      } else if (lowerMsg.includes("ajuda") || lowerMsg.includes("help")) {
        response = `🛠 **Comandos disponíveis:**\n\n• **\"Listar alunos\"** — Ver todos os alunos\n• **\"Alunos sem turma\"** — Verificar quem falta turma\n• **\"Resetar XP do [nome]\"** — Zerar XP de um aluno\n• **\"Estatísticas\"** — Resumo do sistema\n• **\"Ranking\"** — Top alunos por XP\n• **\"Bug\"** — Diagnóstico automático\n• **\"Status do sistema\"** — Verificação geral`;
      } else {
        response = `🤖 Não entendi completamente o comando. Tente:\n\n• \"Listar alunos\"\n• \"Estatísticas\"\n• \"Alunos sem turma\"\n• \"Ranking\"\n• \"Bug\" ou \"erro\"\n• \"Ajuda\"`;
      }
    } catch (err) {
      response = `❌ Erro ao processar: ${err}`;
    }

    const assistantMsg: ChatMessage = { role: "assistant", content: response, timestamp: new Date() };
    setChatMessages(prev => [...prev, assistantMsg]);
    setChatLoading(false);
  };

  const usedCount = keys.filter(k => k.used).length;
  const activeCount = keys.filter(k => !k.used && !k.blocked).length;
  const blockedCount = keys.filter(k => k.blocked).length;

  const filteredStudents = selectedTurma
    ? allStudents.filter(s => s.turma === selectedTurma)
    : allStudents;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto max-w-5xl px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold font-display text-foreground">Painel Admin</h1>
              <p className="text-sm text-muted-foreground">Pablo Martins Santana</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => { logout(); navigate("/login"); }}>
            <LogOut className="h-4 w-4 mr-2" />Sair
          </Button>
        </div>

        <Tabs defaultValue="students" className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-lg">
            <TabsTrigger value="students" className="gap-2"><Users className="h-4 w-4" />Alunos</TabsTrigger>
            <TabsTrigger value="keys" className="gap-2"><Key className="h-4 w-4" />Senhas</TabsTrigger>
            <TabsTrigger value="chat" className="gap-2"><MessageSquare className="h-4 w-4" />Auto-Fix</TabsTrigger>
          </TabsList>

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-6">
            <div className="flex gap-3 items-center flex-wrap">
              <Select value={selectedTurma || "all"} onValueChange={(v) => setSelectedTurma(v === "all" ? "" : v)}>
                <SelectTrigger className="max-w-72"><SelectValue placeholder="Todas as turmas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as turmas</SelectItem>
                  {TURMAS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              <Badge variant="outline">{filteredStudents.length} alunos</Badge>
            </div>

            {turmaStats && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { label: "Alunos", value: turmaStats.total_students },
                  { label: "XP Médio", value: turmaStats.avg_xp },
                  { label: "Nível Médio", value: turmaStats.avg_level },
                  { label: "Min. Estudados", value: turmaStats.total_minutes },
                  { label: "Ativos", value: turmaStats.active_students },
                ].map(s => (
                  <Card key={s.label}>
                    <CardContent className="p-3 text-center">
                      <div className="text-xl font-bold text-primary">{s.value}</div>
                      <div className="text-xs text-muted-foreground">{s.label}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-lg">Alunos</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {studentsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Carregando...</div>
                ) : filteredStudents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">Nenhum aluno encontrado</div>
                ) : filteredStudents.map((s: any) => (
                  <div key={s.user_key} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleViewStudent(s)}>
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                      {s.display_name?.[0] || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{s.display_name}</div>
                      <div className="text-xs text-muted-foreground">{s.turma || "Sem turma"} • Nível {s.level}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-primary text-sm">{s.xp} XP</div>
                      <div className="text-xs text-muted-foreground">{s.total_study_minutes} min</div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {selectedStudent && studentDetail && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="border-primary/30">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <User className="h-5 w-5" />{selectedStudent.display_name}
                      </CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedStudent(null); setStudentDetail(null); }}>✕</Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: "XP Total", value: selectedStudent.xp, color: "text-primary" },
                        { label: "Nível", value: `Nível ${selectedStudent.level}`, color: "" },
                        { label: "Sequência", value: `${selectedStudent.streak_days}🔥`, color: "" },
                        { label: "Estudados", value: `${selectedStudent.total_study_minutes} min`, color: "" },
                      ].map(item => (
                        <div key={item.label} className="text-center p-2 bg-muted rounded-lg">
                          <div className={`font-bold ${item.color}`}>{item.value}</div>
                          <div className="text-xs text-muted-foreground">{item.label}</div>
                        </div>
                      ))}
                    </div>

                    {studentDetail.progress?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Progresso por tópico</h4>
                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                          {studentDetail.progress.map((p: any, i: number) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              <span className={`w-2 h-2 rounded-full ${p.mastery_percent >= 70 ? "bg-green-500" : p.mastery_percent >= 40 ? "bg-yellow-500" : "bg-red-500"}`} />
                              <span className="flex-1 truncate">{p.topic}</span>
                              <span className="text-xs text-muted-foreground">{p.subject}</span>
                              <span className="text-xs font-medium">{p.mastery_percent}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {studentDetail.errors?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2 text-destructive">Erros ativos: {studentDetail.errors.length}</h4>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {studentDetail.errors.slice(0, 5).map((e: any, i: number) => (
                            <div key={i} className="text-xs p-2 bg-destructive/5 rounded">
                              {e.question_text} ({e.subject} • {e.error_count}x)
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </TabsContent>

          {/* Keys Tab */}
          <TabsContent value="keys" className="space-y-6">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-border bg-card p-4 text-center shadow-sm">
                <p className="text-2xl font-bold text-primary">{activeCount}</p>
                <p className="text-xs text-muted-foreground">Disponíveis</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 text-center shadow-sm">
                <p className="text-2xl font-bold text-accent">{usedCount}</p>
                <p className="text-xs text-muted-foreground">Usadas</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 text-center shadow-sm">
                <p className="text-2xl font-bold text-destructive">{blockedCount}</p>
                <p className="text-xs text-muted-foreground">Bloqueadas</p>
              </div>
            </div>

            <Button onClick={generateKey} disabled={generating} className="w-full" size="lg">
              {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Gerar Nova Senha
            </Button>

            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Carregando...</div>
            ) : keys.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Key className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma senha gerada ainda.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {keys.map((k) => (
                  <motion.div key={k.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-border bg-card p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <code className="text-lg font-bold font-mono text-foreground">{k.key}</code>
                        <button onClick={() => copyKey(k.key)} className="text-muted-foreground hover:text-foreground transition-colors">
                          {copiedKey === k.key ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                      {k.blocked ? <Badge variant="destructive">Bloqueada</Badge>
                        : k.used ? <Badge variant="secondary">Usada</Badge>
                        : <Badge className="bg-primary/10 text-primary border-primary/20">Ativa</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground mb-3">
                      Criada em {new Date(k.created_at).toLocaleDateString("pt-BR")}
                      {k.used_by && ` • Usada por: ${k.used_by}`}
                      {k.used_at && ` em ${new Date(k.used_at).toLocaleDateString("pt-BR")}`}
                    </div>
                    <div className="flex gap-2">
                      {k.blocked ? (
                        <Button size="sm" variant="outline" onClick={() => handleAction("unblock", k.id, "Desbloqueada")}>
                          <Unlock className="h-3 w-3 mr-1" /> Desbloquear
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleAction("block", k.id, "Bloqueada")}>
                          <Ban className="h-3 w-3 mr-1" /> Bloquear
                        </Button>
                      )}
                      {k.used && (
                        <Button size="sm" variant="outline" onClick={() => handleAction("reset", k.id, "Resetada")}>
                          <RotateCcw className="h-3 w-3 mr-1" /> Resetar
                        </Button>
                      )}
                      <Button size="sm" variant="destructive" onClick={() => handleAction("delete", k.id, "Apagada")}>
                        <Trash2 className="h-3 w-3 mr-1" /> Apagar
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Auto-Fix Chat Tab */}
          <TabsContent value="chat" className="space-y-4">
            <Card className="h-[60vh] flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Chat Auto-Corretor 🤖
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col overflow-hidden p-4">
                <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-xl px-4 py-2.5 text-sm">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    </div>
                  )}
                </div>
                <form onSubmit={(e) => { e.preventDefault(); if (chatInput.trim()) processAdminChat(chatInput.trim()); }} className="flex gap-2">
                  <Input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    placeholder="Descreva um bug ou peça uma ação..."
                    className="flex-1"
                    disabled={chatLoading}
                  />
                  <Button type="submit" size="icon" disabled={chatLoading || !chatInput.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
