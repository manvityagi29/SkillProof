export type UserRole = 'candidate' | 'captain' | 'recruiter';

export interface Me {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  college?: string | null;
  branch?: string | null;
  github_url?: string | null;
  company?: string | null;
}

export interface Skill {
  id: number;
  name: string;
  category: string;
}

export type VerificationStatus = 'unverified' | 'developing' | 'verified' | 'highly_verified';

export interface PassportSkill {
  skill_id: number;
  skill_name: string;
  category: string;
  assessment_score: string | null;
  evidence_score: string | null;
  verification_score: string;
  verification_status: VerificationStatus;
  updated_at: string;
}

export interface VerificationChain {
  verification: { verification_score: string; verification_status: VerificationStatus } | null;
  assessment: { score: string; correct_count: number; total_count: number; created_at: string } | null;
  evidence: Array<{ title: string; repo_url: string; detected_languages: string[]; evidence_score: string; created_at: string }>;
}

export interface AssessmentQuestion {
  id: number;
  question: string;
  options: string[];
}

export interface OpenTeam {
  id: number;
  name: string;
  hackathon: string | null;
  max_members: number;
  captain_name: string;
  member_count: string;
  required_skills: string[];
}

export interface TeamDetail {
  team: { id: number; name: string; hackathon: string | null; max_members: number; captain_name: string };
  requirements: Array<{ skill_id: number; skill_name: string; category: string; importance: number }>;
  members: Array<{ id: number; user_id: number; status: string; role_label: string | null; name: string; college: string | null }>;
}

export interface TeamCoverage {
  byCategory: Array<{ category: string; coverage_score: string }>;
  overallHealth: number;
}

export interface CandidateMatch {
  userId: number;
  name: string;
  college: string | null;
  matchPercent: number;
  skillBreakdown: Array<{ skillName: string; verificationScore: number; isTeamGap: boolean }>;
}

export interface ChallengePrompt {
  id: number;
  title: string;
  prompt: string;
  time_limit_minutes: number;
}

export interface MyChallenge {
  id: number;
  status: 'assigned' | 'submitted' | 'scored' | 'accepted' | 'rejected';
  score: number | null;
  recommendation: string | null;
  code_submission: string | null;
  correctness: number | null;
  code_quality: number | null;
  problem_solving: number | null;
  comments: string | null;
  verdict: string | null;
  title: string;
  prompt: string;
  instructions: string | null;
  starter_code: string | null;
  time_limit_minutes: number;
  team_name: string;
  skill_name: string;
}

export interface TeamChallenge {
  id: number;
  status: string;
  score: number | null;
  recommendation: string | null;
  code_submission: string | null;
  rubric: Record<string, boolean> | null;
  title: string;
  prompt: string;
  candidate_name: string;
  skill_name: string;
}

export interface AdminStats {
  candidateCount: number;
  verifiedSkillCount: number;
  teamCount: number;
  avgVerification: number;
}

export interface Job {
  id: number;
  title: string;
  min_verification: string;
  created_at: string;
  required_skills: string[];
}

export interface JobCandidate {
  userId: number;
  name: string;
  college: string | null;
  averageScore: number;
  skillBreakdown: Array<{ skillName: string; verificationScore: number }>;
}
