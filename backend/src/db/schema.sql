-- SkillProof / ProofStack schema
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

CREATE TYPE user_role AS ENUM ('candidate', 'captain', 'recruiter');

CREATE TYPE verification_status AS ENUM ('unverified', 'developing', 'verified', 'highly_verified');
CREATE TYPE team_member_status AS ENUM ('pending', 'accepted', 'rejected');
CREATE TYPE challenge_status AS ENUM ('assigned', 'submitted', 'scored', 'accepted', 'rejected');

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'candidate',
  college VARCHAR(160),
  branch VARCHAR(120),
  github_url VARCHAR(255),
  company VARCHAR(160), -- used by recruiter role
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE skills (
  id SERIAL PRIMARY KEY,
  name VARCHAR(80) UNIQUE NOT NULL,
  category VARCHAR(40) NOT NULL -- frontend | backend | design | ml | devops | data
);

CREATE TABLE user_skills (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  claimed_level SMALLINT NOT NULL DEFAULT 3, -- 1-5 self claimed
  assessment_score NUMERIC(5,2),
  evidence_score NUMERIC(5,2),
  verification_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  verification_status verification_status NOT NULL DEFAULT 'unverified',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, skill_id)
);

CREATE TABLE evidence (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  title VARCHAR(160) NOT NULL,
  repo_url VARCHAR(255) NOT NULL,
  detected_languages TEXT[] NOT NULL DEFAULT '{}',
  evidence_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE assessment_questions (
  id SERIAL PRIMARY KEY,
  skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL, -- ["a text","b text","c text","d text"]
  correct_index SMALLINT NOT NULL
);

CREATE TABLE assessment_results (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  score NUMERIC(5,2) NOT NULL,
  correct_count SMALLINT NOT NULL,
  total_count SMALLINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE teams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  hackathon VARCHAR(160),
  captain_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  max_members SMALLINT NOT NULL DEFAULT 4,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE team_requirements (
  id SERIAL PRIMARY KEY,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  importance SMALLINT NOT NULL DEFAULT 3, -- 1-5
  UNIQUE(team_id, skill_id)
);

CREATE TABLE team_members (
  id SERIAL PRIMARY KEY,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status team_member_status NOT NULL DEFAULT 'pending',
  role_label VARCHAR(60),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

CREATE TABLE challenge_prompts (
  id SERIAL PRIMARY KEY,
  skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  title VARCHAR(160) NOT NULL,
  prompt TEXT NOT NULL,
  time_limit_minutes SMALLINT NOT NULL DEFAULT 15,
  instructions TEXT,
  starter_code TEXT
);

CREATE TABLE challenges (
  id SERIAL PRIMARY KEY,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  candidate_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  prompt_id INTEGER NOT NULL REFERENCES challenge_prompts(id),
  code_submission TEXT,
  rubric JSONB, -- {"correctness": 80, "codeQuality": 75, "problemSolving": 85, "overallScore": 80, "comments": "Good structure", "verdict": "ACCEPT"}
  score NUMERIC(5,2),
  recommendation VARCHAR(40),
  correctness SMALLINT,
  code_quality SMALLINT,
  problem_solving SMALLINT,
  comments TEXT,
  verdict VARCHAR(20),
  status challenge_status NOT NULL DEFAULT 'assigned',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  scored_at TIMESTAMPTZ
);

CREATE TABLE challenge_submissions (
  id SERIAL PRIMARY KEY,
  challenge_id INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  candidate_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE assessment_answers (
  id SERIAL PRIMARY KEY,
  attempt_id INTEGER REFERENCES assessment_results(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES assessment_questions(id) ON DELETE CASCADE,
  selected_index SMALLINT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Recruiter (admin) role tables
CREATE TABLE jobs (
  id SERIAL PRIMARY KEY,
  recruiter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(160) NOT NULL,
  min_verification NUMERIC(5,2) NOT NULL DEFAULT 60,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE job_requirements (
  id SERIAL PRIMARY KEY,
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  UNIQUE(job_id, skill_id)
);

CREATE TABLE job_shortlist (
  id SERIAL PRIMARY KEY,
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(job_id, user_id)
);

CREATE INDEX idx_user_skills_user ON user_skills(user_id);
CREATE INDEX idx_evidence_user_skill ON evidence(user_id, skill_id);
CREATE INDEX idx_team_requirements_team ON team_requirements(team_id);
CREATE INDEX idx_challenges_team ON challenges(team_id);
CREATE INDEX idx_challenge_submissions ON challenge_submissions(challenge_id);
CREATE INDEX idx_assessment_answers_user ON assessment_answers(user_id, skill_id);

-- Compatibility views for alternative naming
CREATE OR REPLACE VIEW candidate_skills AS SELECT * FROM user_skills;
CREATE OR REPLACE VIEW github_evidence AS SELECT * FROM evidence;
CREATE OR REPLACE VIEW team_required_skills AS SELECT * FROM team_requirements;
CREATE OR REPLACE VIEW job_required_skills AS SELECT * FROM job_requirements;
CREATE OR REPLACE VIEW shortlists AS SELECT * FROM job_shortlist;
CREATE OR REPLACE VIEW assessment_attempts AS SELECT * FROM assessment_results;
CREATE OR REPLACE VIEW verification_scores AS 
  SELECT user_id, skill_id, assessment_score, evidence_score, verification_score, verification_status, updated_at 
  FROM user_skills;

