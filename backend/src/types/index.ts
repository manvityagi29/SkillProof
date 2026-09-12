export type UserRole = 'candidate' | 'captain' | 'recruiter';

export interface JwtPayload {
  userId: number;
  role: UserRole;
  name: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
