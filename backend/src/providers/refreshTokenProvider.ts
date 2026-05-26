import { prisma } from '../lib/prisma.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

export const refreshTokenProvider = {
  async create(data: {
    user_id: bigint;
    token: string;
    token_family: string;
    device_info?: string | null;
    ip_address?: string | null;
    expires_at: Date;
  }) {
    return db.refreshToken.create({ data });
  },

  async findByToken(hashedToken: string) {
    return db.refreshToken.findUnique({ where: { token: hashedToken } });
  },

  async revokeById(id: bigint, reason: string) {
    return db.refreshToken.update({
      where: { id },
      data: { revoked: true, revoked_at: new Date(), revoked_reason: reason },
    });
  },

  async revokeFamily(tokenFamily: string) {
    return db.refreshToken.updateMany({
      where: { token_family: tokenFamily },
      data: { revoked: true, revoked_at: new Date(), revoked_reason: 'security' },
    });
  },

  async revokeAllForUser(userId: bigint) {
    return db.refreshToken.updateMany({
      where: { user_id: userId, revoked: false },
      data: { revoked: true, revoked_at: new Date(), revoked_reason: 'logout_all' },
    });
  },

  async countActiveSessions(userId: bigint): Promise<number> {
    return db.refreshToken.count({
      where: { user_id: userId, revoked: false, expires_at: { gt: new Date() } },
    });
  },

  async findOldestActiveSession(userId: bigint) {
    return db.refreshToken.findFirst({
      where: { user_id: userId, revoked: false, expires_at: { gt: new Date() } },
      orderBy: { created: 'asc' },
    });
  },

  async deleteExpiredAndOldRevoked() {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return db.refreshToken.deleteMany({
      where: {
        OR: [
          { expires_at: { lt: cutoff } },
          { revoked: true, revoked_at: { lt: cutoff } },
        ],
      },
    });
  },
};
