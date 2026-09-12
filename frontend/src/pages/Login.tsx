import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { api, ApiError } from '../api/client';
import { Me, UserRole } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { Card } from '../components/ui/Card';
import { TextField } from '../components/ui/TextField';
import { SelectField } from '../components/ui/SelectField';
import { Button } from '../components/ui/Button';

const HOME_FOR_ROLE: Record<UserRole, string> = {
  candidate: '/candidate',
  captain: '/captain/team',
  recruiter: '/recruiter',
};


export function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('manu@demo.dev');
  const [password, setPassword] = useState('password123');
  const [role, setRole] = useState<UserRole>('candidate');
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: () => api.post<{ token: string; user: Me }>('/auth/login', { email, password }),
    onSuccess: (data) => {
      login(data.user, data.token);
      navigate(HOME_FOR_ROLE[data.user.role]);
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Login failed'),
  });

  const registerMutation = useMutation({
    mutationFn: () => api.post<{ token: string; user: Me }>('/auth/register', { name, email, password, role }),
    onSuccess: (data) => {
      login(data.user, data.token);
      navigate(HOME_FOR_ROLE[data.user.role]);
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Registration failed'),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (mode === 'login') loginMutation.mutate();
    else registerMutation.mutate();
  }

  const busy = loginMutation.isPending || registerMutation.isPending;

  return (
    <div className="center-screen">
      <div className="auth-card">
        <Card>
          <form onSubmit={handleSubmit} className="stack-200">
            <div className="stack-050">
              <span className="page-title">SkillProof</span>
              <span className="text-subtle">Don't trust what a candidate claims. Trust what they can prove.</span>
            </div>


            <div className="cluster-100" style={{ justifyContent: 'stretch', gridTemplateColumns: '1fr 1fr' }}>
              <Button type="button" variant={mode === 'login' ? 'primary' : 'secondary'} onClick={() => setMode('login')}>Log in</Button>
              <Button type="button" variant={mode === 'register' ? 'primary' : 'secondary'} onClick={() => setMode('register')}>Register</Button>
            </div>

            {mode === 'register' && (
              <>
                <TextField label="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
                <SelectField label="I am a" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
                  <option value="candidate">Candidate</option>
                  <option value="captain">Team Captain</option>
                  <option value="recruiter">Recruiter</option>
                </SelectField>
              </>
            )}

            <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />

            {error && <span style={{ color: 'var(--color-danger-bold)' }}>{error}</span>}

            <Button type="submit" block disabled={busy}>
              {busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
            </Button>

            <span className="text-subtlest">
              Demo accounts (password: password123): manu@demo.dev (candidate), priya@demo.dev (captain), neha@demo.dev (recruiter)
            </span>
          </form>
        </Card>
      </div>
    </div>
  );
}
