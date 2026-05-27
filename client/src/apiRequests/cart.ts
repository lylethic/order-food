import http from '@/lib/http';
import {
  CartResType,
  AddToCartBodyType,
  UpdateCartItemBodyType,
} from '@/schemaValidations/cart.schema';

const cartApiRequest = {
  getCart: (headers?: any) =>
    http.get<{ data: CartResType }>('api/v1/cart', { headers }),
  add: (body: AddToCartBodyType, headers?: any) =>
    http.post<{ data: any }>('api/v1/cart/add', body, { headers }),
  updateItem: (id: string, body: UpdateCartItemBodyType) =>
    http.put<{ data: any }>(`api/v1/cart/update-item/${id}`, body),
  removeItem: (id: string) =>
    http.delete<{ message: string }>(`api/v1/cart/remove/${id}`),
};

export default cartApiRequest;
