import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { VerificationChain, PassportSkill } from '../../api/types';
import { VerificationChainWidget } from '../../components/widgets/VerificationChainWidget';

export function VerificationChainPage() {
  const { userId, skillId } = useParams();

  const { data: chain, isLoading } = useQuery({
    queryKey: ['chain', userId, skillId],
    queryFn: () => api.get<VerificationChain>(`/verification/${userId}/${skillId}/chain`),
  });

  const { data: passport } = useQuery({
    queryKey: ['passport', userId],
    queryFn: () => api.get<{ skills: PassportSkill[] }>(`/users/${userId}/passport`),
  });

  const skillName = passport?.skills.find((s) => String(s.skill_id) === skillId)?.skill_name || 'Skill';

  return (
    <div className="stack-200">
      <Link to="/passport">← Back to Passport</Link>
      {isLoading && <span className="text-subtle">Loading chain…</span>}
      {chain && <VerificationChainWidget chain={chain} skillName={skillName} />}
    </div>
  );
}
