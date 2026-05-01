import { MenuItemReviewBrowser } from '../../components/MenuItemReviewBrowser';

export default function AdminCommentsPage() {
  return (
    <div className='px-6 py-8 md:px-10 max-w-7xl mt-10 mx-auto w-full'>
      <MenuItemReviewBrowser
        title='Quản lý đánh giá'
        subtitle='Duyệt món ăn theo category, mở từng món để xem và xử lý đánh giá.'
        canReply
        canToggleVisibility
        commentScope='all'
      />
    </div>
  );
}
