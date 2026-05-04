import http from '@/lib/http';
import {
  NotificationListResType,
  NotificationResType,
} from '@/schemaValidations/notification.schema';

const notificationApiRequest = {
  list: () => http.get<NotificationListResType>('api/v1/notifications'),

  markRead: (id: string) =>
    http.patch<NotificationResType>(`api/v1/notifications/${id}/read`, {}),
};

export default notificationApiRequest;
