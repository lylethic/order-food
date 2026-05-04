import http from '@/lib/http';
import {
  CreateUrlBodyType,
  CreateUrlResType,
  DeleteUrlResType,
  UrlListResType,
} from '@/schemaValidations/url.schema';

const urlApiRequest = {
  list: (params?: { limit?: number; cursor?: string }) =>
    http.get<UrlListResType>('shorten', { params }),

  create: (body: CreateUrlBodyType) =>
    http.post<CreateUrlResType>('shorten', body),

  delete: (id: string) =>
    http.delete<DeleteUrlResType>(`shorten/${id}`),
};

export default urlApiRequest;
