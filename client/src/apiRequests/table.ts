import http from '@/lib/http';
import {
  VerifyTableTokenResType,
  QrBatchResType,
  GenerateQrBatchBodyType,
  GenerateQrListBodyType,
} from '@/schemaValidations/table.schema';

const tableApiRequest = {
  verifyToken: (params: { table: string; sid: string }) =>
    http.get<VerifyTableTokenResType>('api/v1/tables/verify', { params }),

  generateQrBatch: (body: GenerateQrBatchBodyType) =>
    http.post<QrBatchResType>('api/v1/tables/qr/batch', body),

  generateQrList: (body: GenerateQrListBodyType) =>
    http.post<QrBatchResType>('api/v1/tables/qr/batch', body),
};

export default tableApiRequest;
