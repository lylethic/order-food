import bcrypt from 'bcryptjs';
import { userDal } from '../dal/user.dal';
import { AppError } from '../utils/AppError.js';
import {
  UserCreateBodyType,
  UserResType,
  UserRes,
  UserUpdateBodyType,
} from '../schemas/user';
import { BaseListResType, BaseSearchRequestType } from '../schemas/search';
import { roleDal } from '../dal/role.dal';

export const userService = {
  async create(data: UserCreateBodyType): Promise<UserResType> {
    var exstingEmail = await userDal.findByEmail(data.email);
    if (exstingEmail) throw new AppError(409, 'Email already registered');

    const hashed = await bcrypt.hash(data.password, 12);
    var result = await userDal.create({ ...data, password: hashed });
    const role = await roleDal.findRoleByName('Customer'.toUpperCase());
    if (role) await roleDal.assignRole(result.id, role.id);
    return UserRes.parse(result);
  },

  async update(data: UserUpdateBodyType, id: number) {
    var user = await userDal.findById(id);
    if (!user) throw new AppError(404, 'User not found');

    var result = await userDal.update(data, id);
    return UserRes.parse(result);
  },

  async findById(id: number) {
    var result = await userDal.findById(id);
    return UserRes.parse(result);
  },

  async delete(id: number) {
    var user = await userDal.findById(id);
    if (!user) throw new AppError(404, 'User not found');
    var result = await userDal.delete(id);
    return UserRes.parse(result);
  },

  async findAll(request: BaseSearchRequestType): Promise<BaseListResType> {
    const limit = request.limit;
    const users = await userDal.findAll(request);
    const hasNextPage = users.length > limit;
    const items = hasNextPage ? users.slice(0, limit) : users;
    const nextCursor =
      hasNextPage && items.length > 0 ? items[items.length - 1].id : null;
    return {
      data: items.map((user) => UserRes.parse(user)),
      limit,
      nextCursor,
      hasNextPage,
    };
  },
};
