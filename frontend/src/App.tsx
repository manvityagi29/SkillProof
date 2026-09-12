import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { RoleGuard } from './components/layout/RoleGuard';
import { LoginPage } from './pages/Login';
import { CandidateDashboardPage } from './pages/candidate/CandidateDashboard';
import { PassportPage } from './pages/candidate/Passport';
import { VerificationChainPage } from './pages/candidate/VerificationChain';
import { AssessmentsListPage } from './pages/candidate/AssessmentsList';
import { AssessmentPage } from './pages/candidate/Assessment';
import { BrowseTeamsPage } from './pages/candidate/BrowseTeams';
import { MyChallengesPage } from './pages/candidate/MyChallenges';
import { CandidateProfilePage } from './pages/candidate/CandidateProfile';
import { MyTeamsPage } from './pages/captain/MyTeams';
import { CreateTeamPage } from './pages/captain/CreateTeam';
import { TeamDashboardPage } from './pages/captain/TeamDashboard';
import { DiscoveryPage } from './pages/captain/Discovery';
import { ChallengeReviewPage } from './pages/captain/ChallengeReview';
import { RecruiterDashboardPage } from './pages/admin/RecruiterDashboard';
import { JobsPage } from './pages/admin/Jobs';
import { CreateJobPage } from './pages/admin/CreateJob';
import { RecruiterCandidatesPage } from './pages/admin/RecruiterCandidates';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<AppShell />}>
          {/* Shared Verification Chain */}
          <Route path="/verification/:userId/:skillId" element={<VerificationChainPage />} />
          <Route path="/candidate/verification/:userId/:skillId" element={<VerificationChainPage />} />

          {/* Candidate Experience */}
          <Route element={<RoleGuard allow={['candidate']} />}>
            <Route path="/candidate" element={<CandidateDashboardPage />} />
            <Route path="/candidate/passport" element={<PassportPage />} />
            <Route path="/candidate/assessments" element={<AssessmentsListPage />} />
            <Route path="/candidate/assessments/:skillId" element={<AssessmentPage />} />
            <Route path="/candidate/teams" element={<BrowseTeamsPage />} />
            <Route path="/candidate/challenges" element={<MyChallengesPage />} />
            <Route path="/candidate/profile" element={<CandidateProfilePage />} />

            {/* Aliases for backwards compatibility */}
            <Route path="/passport" element={<Navigate to="/candidate/passport" replace />} />
            <Route path="/assessment/:skillId" element={<AssessmentPage />} />
            <Route path="/teams" element={<Navigate to="/candidate/teams" replace />} />
            <Route path="/challenges" element={<Navigate to="/candidate/challenges" replace />} />
          </Route>

          {/* Captain Experience */}
          <Route element={<RoleGuard allow={['captain']} />}>
            <Route path="/captain" element={<Navigate to="/captain/team" replace />} />
            <Route path="/captain/team" element={<MyTeamsPage />} />
            <Route path="/captain/teams" element={<MyTeamsPage />} />
            <Route path="/captain/create-team" element={<CreateTeamPage />} />
            <Route path="/captain/teams/:id" element={<TeamDashboardPage />} />
            <Route path="/captain/candidates" element={<DiscoveryPage />} />
            <Route path="/captain/teams/:id/discovery" element={<DiscoveryPage />} />
            <Route path="/captain/challenges" element={<ChallengeReviewPage />} />
            <Route path="/captain/teams/:id/challenges" element={<ChallengeReviewPage />} />
          </Route>

          {/* Recruiter Experience */}
          <Route element={<RoleGuard allow={['recruiter']} />}>
            <Route path="/recruiter" element={<RecruiterDashboardPage />} />
            <Route path="/recruiter/jobs" element={<JobsPage />} />
            <Route path="/recruiter/jobs/create" element={<CreateJobPage />} />
            <Route path="/recruiter/candidates" element={<RecruiterCandidatesPage />} />

            {/* Aliases for backwards compatibility */}
            <Route path="/admin/dashboard" element={<Navigate to="/recruiter" replace />} />
            <Route path="/admin/jobs" element={<Navigate to="/recruiter/jobs" replace />} />
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
