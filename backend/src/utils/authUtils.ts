import jwt from 'jsonwebtoken';

export function generateToken(
  userId: string,
  email: string,
  role: string[] | string,
): string {
  return jwt.sign({ userId, email, role }, process.env.JWT_SECRET!, {
    expiresIn: (process.env.JWT_EXPIRES_IN ??
      '7d') as jwt.SignOptions['expiresIn'],
  });
}
