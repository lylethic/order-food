import bcrypt from 'bcryptjs';
import { userProvider } from '../providers/userProvider.js';
import { roleProvider } from '../providers/roleProvider.js';
import { AppError } from '../utils/AppError.js';
import type {
  RegisterBodyType,
  LoginRequest,
  GuestRegisterBodyType,
} from '../schemas/validation.js';
import { AuthResultType, SafeUserType } from '../schemas/auth.js';
import { generateToken } from '../utils/authUtils.js';

function toSafeUser(user: {
  id: bigint;
  email: string;
  username: string | null;
  name: string | null;
  img?: string | null;
}): SafeUserType {
  return {
    id: user.id.toString(),
    email: user.email,
    username: user.username,
    name: user.name,
    img: user.img ?? null,
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
  async register(dto: RegisterBodyType): Promise<AuthResultType> {
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
    const token = generateToken(user.id.toString(), user.email, roles);
    return { token, user: toSafeUser(user), role: roles };
  },

  /** Guest register — creates a guest user and returns a JWT */
  async guestRegister(dto: GuestRegisterBodyType): Promise<AuthResultType> {
    const user = await userProvider.createGuest({
      name: dto.name,
      phone: dto.phone,
      is_guest: true,
    });
    const roles = ['CUSTOMER'];
    const token = generateToken(user.id.toString(), user.email ?? '', roles);
    return { token, user: toSafeUser(user), role: roles };
  },

  /**
   * 1. Find user by email
   * 2. Compare bcrypt hash (same error message for both cases → prevents user enumeration)
   * 3. Return signed JWT + primary role
   */
  async login(dto: LoginRequest): Promise<AuthResultType> {
    const user = await userProvider.findByEmail(dto.email);
    if (!user) throw new AppError(401, 'Invalid email or password');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new AppError(401, 'Invalid email or password');

    const roles = user.roles.map((userRole: any) => userRole.role.name);
    const primaryRole = roles.length > 0 ? roles : ['CUSTOMER'];
    const token = generateToken(user.id.toString(), user.email, primaryRole);
    return { token, user: toSafeUser(user), role: primaryRole };
  },

  /** Return the profile of the currently authenticated user. */
  async me(userId: string): Promise<SafeUserType & { role: string[] }> {
    const user = await userProvider.findById(Number(userId));
    if (!user) throw new AppError(404, 'User not found');

    const roles = user.roles.map((userRole: any) => userRole.role.name);
    return {
      ...toSafeUser(user),
      role: roles.length > 0 ? roles : ['CUSTOMER'],
    };
  },
};
