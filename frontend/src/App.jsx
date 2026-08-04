import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';

// Pages
import LoginPage from './pages/LoginPage.jsx';
import AcceptInvitePage from './pages/AcceptInvitePage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import AssociationsPage from './pages/AssociationsPage.jsx';
import AssociationProfilePage from './pages/AssociationProfilePage.jsx';
import AssessmentRoundsPage from './pages/AssessmentRoundsPage.jsx';
import AssessmentsPage from './pages/AssessmentsPage.jsx';
import AssessmentFormPage from './pages/AssessmentFormPage.jsx';
import ReviewPage from './pages/ReviewPage.jsx';
import ScorecardPage from './pages/ScorecardPage.jsx';
import ActionPlansPage from './pages/ActionPlansPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import UsersPage from './pages/UsersPage.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/accept-invite" element={<AcceptInvitePage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="associations" element={<AssociationsPage />} />
        <Route path="associations/:id" element={<AssociationProfilePage />} />
        <Route path="assessment-rounds" element={<AssessmentRoundsPage />} />
        <Route path="assessments" element={<AssessmentsPage />} />
        <Route path="assessments/:id/form" element={<AssessmentFormPage />} />
        <Route path="assessments/:id/review" element={<ReviewPage />} />
        <Route path="assessments/:id/scorecard" element={<ScorecardPage />} />
        <Route path="action-plans" element={<ActionPlansPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
