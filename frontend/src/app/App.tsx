import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '../lib/theme-context';
import { Toaster } from './components/ui/sonner';

// Layout
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { Landing } from './components/pages/Landing';
import { SignIn } from './components/pages/SignIn';
import { SignUp } from './components/pages/SignUp';
import { Dashboard } from './components/pages/Dashboard';
import { LessonDetail } from './components/pages/LessonDetail';
import { QuizMode } from './components/pages/QuizMode';
import { Chat } from './components/pages/Chat';
import { Progress } from './components/pages/Progress';
import { Settings } from './components/pages/Settings';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Protected routes with layout */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Navigate to="/lessons" replace />} />
            <Route path="/lessons" element={<Dashboard />} />
            <Route path="/lesson/:id" element={<LessonDetail />} />
            <Route path="/quiz" element={<QuizMode />} />
            <Route path="/quiz/:lessonId" element={<QuizMode />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </ThemeProvider>
  );
}