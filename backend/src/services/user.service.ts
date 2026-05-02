import bcrypt from 'bcryptjs';
import { userProvider } from '../providers/userProvider';
import { AppError } from '../utils/AppError.js';
import {
  UserCreateBodyType,
  UserResType,
  UserRes,
  UserUpdateBodyType,
} from '../schemas/user';
import { BaseListResType, BaseSearchRequestType } from '../schemas/search';
import { roleProvider } from '../providers/roleProvider';

export const userService = {
  async create(data: UserCreateBodyType): Promise<UserResType> {
    var exstingEmail = await userProvider.findByEmail(data.email);
    if (exstingEmail) throw new AppError(409, 'Email already registered');

    const hashed = await bcrypt.hash(data.password, 12);
    var result = await userProvider.create({ ...data, password: hashed });
    const role = await roleProvider.findRoleByName('Customer'.toUpperCase());
    if (role) await roleProvider.assignRole(result.id, role.id);
    return UserRes.parse(result);
  },

  async update(data: UserUpdateBodyType, id: number) {
    var user = await userProvider.findById(id);
    if (!user) throw new AppError(404, 'User not found');

    var result = await userProvider.update(data, id);
    return UserRes.parse(result);
  },

  async findById(id: number) {
    var result = await userProvider.findById(id);
    return UserRes.parse(result);
  },

  async findByPhone(phone: string) {
    var result = await userProvider.findByPhone(phone);
    return UserRes.parse(result);
  },

  async delete(id: number) {
    var user = await userProvider.findById(id);
    if (!user) throw new AppError(404, 'User not found');
    var result = await userProvider.delete(id);
    return UserRes.parse(result);
  },

  async findAll(request: BaseSearchRequestType): Promise<BaseListResType> {
    const limit = request.limit;
    const users = await userProvider.findAll(request);
    const hasNextPage = users.length > limit;
    const items = hasNextPage ? users.slice(0, limit) : users;
    const nextCursor =
      hasNextPage && items.length > 0 ? items[items.length - 1].id : null;
    return {
      data: items.map((user: any) => UserRes.parse(user)),
      limit,
      nextCursor,
      hasNextPage,
    };
  },

  async assignRole(userId: number, roleId: number) {
    var user = await userProvider.findById(userId);
    if (!user) throw new AppError(404, 'User not found');

    var role = await roleProvider.findById(roleId);
    if (!role) throw new AppError(404, 'Role not found');

    await roleProvider.assignRole(user.id, role.id);
    return true;
  },

  async removeAssignRole(userId: number, roleId: number) {
    var user = await userProvider.findById(userId);
    if (!user) throw new AppError(404, 'User not found');

    var role = await roleProvider.findById(roleId);
    if (!role) throw new AppError(404, 'Role not found');

    await roleProvider.removeAssignRole(user.id, role.id);
    return true;
  },

  async updateAvatar(userId: number, imgUrl: string): Promise<UserResType> {
    var user = await userProvider.findById(userId);
    if (!user) throw new AppError(404, 'User not found');

    var result = await userProvider.updateImg(userId, imgUrl);
    return UserRes.parse(result);
  },
};
