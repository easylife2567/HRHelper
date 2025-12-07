import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { MainLayout } from './components/MainLayout';
// Import pages placeholders
import { ResumeEvaluation } from './pages/ResumeEvaluation.tsx';
import { TalentPool } from './pages/TalentPool.tsx';
import { EmailCustomization } from './pages/EmailCustomization.tsx';
import { InterviewQuestions } from './pages/InterviewQuestions.tsx';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<MainLayout />}>
          <Route path="resume" element={<ResumeEvaluation />} />
          <Route path="talent" element={<TalentPool />} />
          <Route path="email" element={<EmailCustomization />} />
          <Route path="interview" element={<InterviewQuestions />} />
        </Route>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
