import http from '@/lib/http';
import {
  CategoryListResType,
  CategoryResType,
  CreateCategoryBodyType,
  UpdateCategoryBodyType,
} from '@/schemaValidations/menu.schema';

type SimpleRes = {
  success: boolean;
  statusCode: number;
  message: string;
  data: any;
};

const categoryApiRequest = {
  list: () =>
    http.get<CategoryListResType>('api/v1/categories', {
      cache: 'no-store',
    }),

  getById: (id: string) => http.get<CategoryResType>(`api/v1/categories/${id}`),

  create: (body: CreateCategoryBodyType) =>
    http.post<CategoryResType>('api/v1/categories', body),

  update: (id: string, body: UpdateCategoryBodyType) =>
    http.put<CategoryResType>(`api/v1/categories/${id}`, body),

  uploadImage: (id: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return http.put<CategoryResType>(`api/v1/categories/${id}/img`, form);
  },

  delete: (id: string) => http.delete<SimpleRes>(`api/v1/categories/${id}`),
};

export default categoryApiRequest;
