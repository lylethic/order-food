import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { userProvider } from '../providers/userProvider.js';
import { roleProvider } from '../providers/roleProvider.js';
import { refreshTokenProvider } from '../providers/refreshTokenProvider.js';
import { AppError } from '../utils/AppError.js';
import type {
  RegisterBodyType,
  LoginRequest,
  GuestRegisterBodyType,
} from '../schemas/validation.js';
import { AuthResultType, SafeUserType } from '../schemas/auth.js';
import {
  ACCESS_TOKEN_EXPIRY_MS,
  ACCESS_TOKEN_EXPIRY_SECONDS,
  generateAccessToken,
  generateRefreshToken,
  generateTokenFamily,
  hashToken,
  MAX_SESSIONS,
  REFRESH_TOKEN_EXPIRY_SECONDS,
  REFRESH_TOKEN_EXPIRY_DAYS,
} from '../utils/authUtils.js';

function toSafeUser(user: {
  id: bigint;
  email: string | null;
  username: string | null;
  name: string | null;
  img?: string | null;
}): SafeUserType {
  return {
    id: user.id.toString(),
    email: user.email ?? '',
    username: user.username,
    name: user.name,
    img: user.img ?? null,
  };
}

async function issueTokenPair(
  user: { id: bigint; token_version: number; email: string | null },
  roles: string[],
  req: { headers: Record<string, string | string[] | undefined>; ip?: string },
): Promise<{ accessToken: string; refreshToken: string }> {
  const rawRefresh = generateRefreshToken();
  const hashed = hashToken(rawRefresh);
  const family = generateTokenFamily();

  // Enforce max sessions
  const count = await refreshTokenProvider.countActiveSessions(user.id);
  if (count >= MAX_SESSIONS) {
    const oldest = await refreshTokenProvider.findOldestActiveSession(user.id);
    if (oldest)
      await refreshTokenProvider.revokeById(oldest.id, 'session_limit');
  }

  const ip =
    (Array.isArray(req.headers['x-forwarded-for'])
      ? req.headers['x-forwarded-for'][0]
      : req.headers['x-forwarded-for']) ??
    req.ip ??
    null;

  await refreshTokenProvider.create({
    user_id: user.id,
    token: hashed,
    token_family: family,
    device_info: (req.headers['user-agent'] as string) ?? null,
    ip_address: ip as string | null,
    expires_at: new Date(
      Date.now() + Number(REFRESH_TOKEN_EXPIRY_DAYS) * 24 * 60 * 60 * 1000,
    ),
  });

  const accessToken = generateAccessToken(
    user.id,
    user.token_version,
    user.email ?? '',
    roles,
  );
  return { accessToken, refreshToken: rawRefresh };
}

export const authService = {
  async register(
    dto: RegisterBodyType,
    reqCtx: {
      headers: Record<string, string | string[] | undefined>;
      ip?: string;
    } = { headers: {} },
  ): Promise<AuthResultType & { refreshToken: string; refreshTokenExpiresAt: string }> {
    const existing = await userProvider.findByEmail(dto.email);
    if (existing) throw new AppError(409, 'Email already registered');

    const hashed = await bcrypt.hash(dto.password, 12);
    const user = await userProvider.create({
      email: dto.email,
      password: hashed,
      username: dto.username,
      name: dto.name,
    });

    const roleName = dto.role ?? 'CUSTOMER';
    const role = await roleProvider.findRoleByName(roleName);
    if (role) await roleProvider.assignRole(user.id, role.id);

    const roles = [roleName];
    const { accessToken, refreshToken } = await issueTokenPair(
      { id: user.id, token_version: 0, email: user.email },
      roles,
      reqCtx,
    );
    const expiresAt = new Date(Date.now() + ACCESS_TOKEN_EXPIRY_MS);
    const refreshTokenExpiresAt = new Date(
      Date.now() + Number(REFRESH_TOKEN_EXPIRY_DAYS) * 24 * 60 * 60 * 1000,
    );
    return {
      token: accessToken,
      expiresAt: expiresAt.toISOString(),
      refreshToken,
      refreshTokenExpiresAt: refreshTokenExpiresAt.toISOString(),
      user: toSafeUser(user),
      role: roles,
    };
  },

  async guestRegister(dto: GuestRegisterBodyType): Promise<AuthResultType> {
    const existing = await userProvider.findByPhone(dto.phone);
    const user =
      existing ??
      (await userProvider.createGuest({
        name: dto.name,
        phone: dto.phone,
        is_guest: true,
      }));
    const roles = ['GUEST'];
    const { accessToken } = await issueTokenPair(
      { id: user.id, token_version: 0, email: user.email },
      roles,
      { headers: {}, ip: undefined },
    );
    const expiresAt = new Date(Date.now() + ACCESS_TOKEN_EXPIRY_MS);
    return {
      token: accessToken,
      expiresAt: expiresAt.toISOString(),
      user: toSafeUser(user),
      role: roles,
    };
  },

  async login(
    dto: LoginRequest,
    reqCtx: {
      headers: Record<string, string | string[] | undefined>;
      ip?: string;
    },
  ): Promise<
    AuthResultType & { refreshToken: string; refreshTokenExpiresAt: string }
  > {
    const user = await userProvider.findByEmail(dto.email);
    if (!user) throw new AppError(401, 'Invalid email or password');

    const valid = await bcrypt.compare(dto.password, user.password!);
    if (!valid) throw new AppError(401, 'Invalid email or password');

    const roles = (user.roles as any[]).map((ur) => ur.role.name);
    const primaryRoles = roles.length > 0 ? roles : ['CUSTOMER'];

    const fullUser = await (prisma.user.findUnique as any)({
      where: { id: user.id },
      select: { token_version: true },
    });
    const tokenVersion = (fullUser as any)?.token_version ?? 0;

    const { accessToken, refreshToken } = await issueTokenPair(
      { id: user.id, token_version: tokenVersion, email: user.email },
      primaryRoles,
      reqCtx,
    );
    const expiresAt = new Date(Date.now() + ACCESS_TOKEN_EXPIRY_MS);
    const refreshTokenExpiresAt = new Date(
      Date.now() + Number(REFRESH_TOKEN_EXPIRY_DAYS) * 24 * 60 * 60 * 1000,
    );
    return {
      token: accessToken,
      expiresAt: expiresAt.toISOString(),
      refreshToken,
      refreshTokenExpiresAt: refreshTokenExpiresAt.toISOString(),
      user: toSafeUser(user),
      role: primaryRoles,
    };
  },

  async refresh(
    rawToken: string,
    reqCtx: {
      headers: Record<string, string | string[] | undefined>;
      ip?: string;
    },
  ): Promise<{
    accessToken: string;
    expiresAt: string;
    expiresIn: number;
    refreshToken: string;
    refreshExpires: number;
  }> {
    const hashed = hashToken(rawToken);
    const stored = await refreshTokenProvider.findByToken(hashed);
    if (!stored) throw new AppError(401, 'Invalid refresh token');

    if (stored.revoked) {
      await refreshTokenProvider.revokeFamily(stored.token_family);
      throw new AppError(401, 'Security alert: token reuse detected');
    }

    if (stored.expires_at < new Date()) {
      throw new AppError(401, 'Refresh token expired');
    }

    const user = await prisma.user.findUnique({
      where: { id: stored.user_id },
      include: { roles: { include: { role: true } } },
    });
    if (!user || user.deleted || !user.active)
      throw new AppError(401, 'User not found');

    await refreshTokenProvider.revokeById(stored.id, 'rotation');

    const roles = (user.roles as any[]).map((ur) => ur.role.name);
    const rawNew = generateRefreshToken();
    const hashedNew = hashToken(rawNew);
    const ip =
      (Array.isArray(reqCtx.headers['x-forwarded-for'])
        ? reqCtx.headers['x-forwarded-for'][0]
        : reqCtx.headers['x-forwarded-for']) ??
      reqCtx.ip ??
      null;

    await refreshTokenProvider.create({
      user_id: user.id,
      token: hashedNew,
      token_family: stored.token_family,
      device_info: (reqCtx.headers['user-agent'] as string) ?? null,
      ip_address: ip as string | null,
      expires_at: new Date(
        Date.now() + Number(REFRESH_TOKEN_EXPIRY_DAYS) * 24 * 60 * 60 * 1000,
      ),
    });

    const accessToken = generateAccessToken(
      user.id,
      (user as any).token_version ?? 0,
      user.email ?? '',
      roles,
    );
    const expiresAt = new Date(Date.now() + ACCESS_TOKEN_EXPIRY_MS);

    return {
      accessToken,
      expiresAt: expiresAt.toISOString(),
      expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS,
      refreshToken: rawNew,
      refreshExpires: REFRESH_TOKEN_EXPIRY_SECONDS,
    };
  },

  async logout(rawToken: string): Promise<void> {
    if (!rawToken) return;
    const hashed = hashToken(rawToken);
    const stored = await refreshTokenProvider.findByToken(hashed);
    if (!stored) return;
    await refreshTokenProvider.revokeById(stored.id, 'logout');
  },

  async logoutAll(userId: bigint): Promise<void> {
    await (prisma as any).user.update({
      where: { id: userId },
      data: { token_version: { increment: 1 } },
    });
    await refreshTokenProvider.revokeAllForUser(userId);
  },

  async changePassword(
    userId: bigint,
    currentPassword: string,
    newPassword: string,
    reqCtx: {
      headers: Record<string, string | string[] | undefined>;
      ip?: string;
    },
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { role: true } } },
    });
    if (!user) throw new AppError(404, 'User not found');

    const valid = await bcrypt.compare(currentPassword, user.password!);
    if (!valid) throw new AppError(401, 'Current password is incorrect');

    if (newPassword.length < 8)
      throw new AppError(400, 'New password must be at least 8 characters');

    const newHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { password: newHash },
    });

    // Logout all — increment version + revoke all tokens
    await (prisma as any).user.update({
      where: { id: userId },
      data: { token_version: { increment: 1 } },
    });
    await refreshTokenProvider.revokeAllForUser(userId);

    // Issue fresh tokens for current session
    const updatedUser = await prisma.user.findUnique({ where: { id: userId } });
    const roles = (user.roles as any[]).map((ur) => ur.role.name);
    const { accessToken, refreshToken } = await issueTokenPair(
      {
        id: userId,
        token_version: (updatedUser as any)!.token_version ?? 0,
        email: user.email,
      },
      roles,
      reqCtx,
    );
    return { accessToken, refreshToken };
  },

  async me(userId: string): Promise<SafeUserType & { role: string[] }> {
    const user = await userProvider.findById(Number(userId));
    if (!user) throw new AppError(404, 'User not found');
    const roles = (user.roles as any[]).map((ur: any) => ur.role.name);
    return {
      ...toSafeUser(user),
      role: roles.length > 0 ? roles : ['CUSTOMER'],
    };
  },
};
