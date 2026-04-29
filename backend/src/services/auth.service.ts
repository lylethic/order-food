import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userDal } from '../dal/user.dal.js';
import { roleDal } from '../dal/role.dal.js';
import { AppError } from '../utils/AppError.js';
import type { RegisterBodyType, LoginRequest } from '../schemas/validation.js';

export interface SafeUser {
  id: string;
  email: string;
  username: string | null;
  name: string | null;
}

export interface AuthResult {
  token: string;
  user: SafeUser;
  role: string;
}

function generateToken(userId: string, email: string, role: string): string {
  return jwt.sign({ userId, email, role }, process.env.JWT_SECRET!, {
    expiresIn: (process.env.JWT_EXPIRES_IN ??
      '7d') as jwt.SignOptions['expiresIn'],
  });
}

function toSafeUser(user: {
  id: bigint;
  email: string;
  username: string | null;
  name: string | null;
}): SafeUser {
  return {
    id: user.id.toString(),
    email: user.email,
    username: user.username,
    name: user.name,
  };
}

/**
 * Service Layer — Auth
 * Business logic for registration, login, and profile retrieval.
 */
export const authService = {
  /**
   * 1. Guard duplicate email
   * 2. Hash password (bcrypt cost 12)
   * 3. Insert user row
   * 4. Assign role via join table
   * 5. Return signed JWT + safe user
   */
  async register(dto: RegisterBodyType): Promise<AuthResult> {
    const existing = await userDal.findByEmail(dto.email);
    if (existing) throw new AppError(409, 'Email already registered');

    const hashed = await bcrypt.hash(dto.password, 12);
    const user = await userDal.create({
      email: dto.email,
      password: hashed,
      username: dto.username,
      name: dto.name,
    });

    const roleName = dto.role ?? 'Customer';
    const role = await roleDal.findRoleByName(roleName);
    if (role) await roleDal.assignRole(user.id, role.id);

    const token = generateToken(user.id.toString(), user.email, roleName);
    return { token, user: toSafeUser(user), role: roleName };
  },

  /**
   * 1. Find user by email
   * 2. Compare bcrypt hash (same error message for both cases → prevents user enumeration)
   * 3. Return signed JWT + primary role
   */
  async login(dto: LoginRequest): Promise<AuthResult> {
    const user = await userDal.findByEmail(dto.email);
    if (!user) throw new AppError(401, 'Invalid email or password');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new AppError(401, 'Invalid email or password');

    const primaryRole = user.roles[0]?.role?.name ?? 'Customer';
    const token = generateToken(user.id.toString(), user.email, primaryRole);
    return { token, user: toSafeUser(user), role: primaryRole };
  },

  /** Return the profile of the currently authenticated user. */
  async me(userId: string): Promise<SafeUser & { role: string }> {
    const user = await userDal.findById(Number(userId));
    if (!user) throw new AppError(404, 'User not found');
    return {
      ...toSafeUser(user),
      role: user.roles[0]?.role?.name ?? 'Customer',
    };
  },
};
