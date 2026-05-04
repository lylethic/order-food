import { cache } from 'react';
import { Metadata, ResolvingMetadata } from 'next';
import { cookies } from 'next/headers';
import envConfig from '@/config';
import { baseOpenGraph } from '@/app/shared-metadata';
import orderApiRequest from '@/apiRequests/order';
import StatusPageClient from '../_components/StatusPageClient';
import OrderDetail from '../_components/OrderDetail';

const getDetail = cache(orderApiRequest.getDetailOrder);

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(
  props: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const params = await props.params;
  const { payload } = await getDetail(Number(params.id));
  const orderDetail = payload.data;
  const url = envConfig.NEXT_PUBLIC_URL + '/status/' + orderDetail?.id;
  return {
    title: orderDetail?.ticketNumber,
    description: orderDetail?.ticketNumber + '|' + orderDetail?.status,
    openGraph: {
      ...baseOpenGraph,
      title: orderDetail?.ticketNumber,
      description: orderDetail?.ticketNumber + '|' + orderDetail?.status,
      url,
      images: [
        {
          url: orderDetail?.items?.[0]?.image
            ? envConfig.NEXT_PUBLIC_API_ENDPOINT + orderDetail.items[0].image
            : '',
        },
      ],
    },
    alternates: {
      canonical: url,
    },
  };
}

export default async function StatusPage({ params, searchParams }: Props) {
  const cookieStore = await cookies();
  const token = cookieStore.get('sessionToken');
  if (!token) return;
  let result = null;
  try {
    const { payload } = await getDetail(Number((await params).id), token.value);
    result = payload.data;
  } catch (error) {}

  return (
    <div>
      {!result ? (
        <div>Không có kết quả</div>
      ) : (
        <OrderDetail initialData={result} />
      )}
    </div>
  );
}
