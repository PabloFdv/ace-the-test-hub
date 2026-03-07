import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import GradePage from "./pages/GradePage";
import SubjectPage from "./pages/SubjectPage";
import LessonPage from "./pages/LessonPage";
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import ChatPage from "./pages/ChatPage";
import StudentDashboard from "./pages/StudentDashboard";
import RankingPage from "./pages/RankingPage";
import BattlePage from "./pages/BattlePage";
import SimulatorPage from "./pages/SimulatorPage";
import ErrorLabPage from "./pages/ErrorLabPage";
import AutoStudyPage from "./pages/AutoStudyPage";
import FocusPage from "./pages/FocusPage";
import ChallengePage from "./pages/ChallengePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, role } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role !== "admin") return <Navigate to="/" replace />;
  return <>{children}</>;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
    <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
    <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
    <Route path="/dashboard" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
    <Route path="/ranking" element={<ProtectedRoute><RankingPage /></ProtectedRoute>} />
    <Route path="/battle" element={<ProtectedRoute><BattlePage /></ProtectedRoute>} />
    <Route path="/simulator" element={<ProtectedRoute><SimulatorPage /></ProtectedRoute>} />
    <Route path="/error-lab" element={<ProtectedRoute><ErrorLabPage /></ProtectedRoute>} />
    <Route path="/auto-study" element={<ProtectedRoute><AutoStudyPage /></ProtectedRoute>} />
    <Route path="/focus" element={<ProtectedRoute><FocusPage /></ProtectedRoute>} />
    <Route path="/:gradeId" element={<ProtectedRoute><GradePage /></ProtectedRoute>} />
    <Route path="/:gradeId/:subjectId" element={<ProtectedRoute><SubjectPage /></ProtectedRoute>} />
    <Route path="/:gradeId/:subjectId/:topic" element={<ProtectedRoute><LessonPage /></ProtectedRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
