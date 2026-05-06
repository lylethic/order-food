import http from '@/lib/http';
import {
  MenuItemListResType,
  MenuItemResType,
  CreateMenuItemBodyType,
  UpdateMenuItemBodyType,
} from '@/schemaValidations/menu.schema';

type SimpleRes = {
  success: boolean;
  statusCode: number;
  message: string;
  data: any;
};

const menuItemApiRequest = {
  list: (params?: {
    search?: string;
    categoryId?: string | number;
    limit?: number;
    order?: 'asc' | 'desc';
  }) =>
    http.get<MenuItemListResType>('api/v1/menuItems', {
      params: {
        limit: 10,
        order: 'desc',
        ...params,
      },
    }),

  getById: (id: string) => http.get<MenuItemResType>(`api/v1/menuItems/${id}`),

  create: (body: CreateMenuItemBodyType) =>
    http.post<MenuItemResType>('api/v1/menuItems', {
      category_id: body.category_id,
      name: body.name,
      description: body.description,
      price: body.price,
      image: '',
      rating: 0,
      tag: body.tag ?? '',
    }),

  update: (id: string, body: UpdateMenuItemBodyType) =>
    http.put<MenuItemResType>(`api/v1/menuItems/${id}`, {
      category_id: body.category_id,
      name: body.name,
      description: body.description,
      price: body.price,
      image: '',
      rating: 0,
      tag: body.tag ?? '',
    }),

  uploadImages: (id: string, files: File[], primaryIndex?: number) => {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    if (primaryIndex !== undefined)
      form.append('primaryIndex', String(primaryIndex));
    return http.post<MenuItemResType>(`api/v1/menuItems/${id}/images`, form);
  },

  deleteImage: (menuItemId: string, imageId: string) =>
    http.delete<MenuItemResType>(
      `api/v1/menuItems/${menuItemId}/images/${imageId}`,
    ),

  delete: (id: string) => http.delete<SimpleRes>(`api/v1/menuItems/${id}`),
};

export default menuItemApiRequest;
