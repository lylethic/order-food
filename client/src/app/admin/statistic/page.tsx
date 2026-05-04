import DashboardList from './_component/dashboard-list';

const DashboardPage = () => {
  return (
    <div className='block w-full h-full overflow-x-auto'>
      <div className='min-w-full p-2 md:p-4'>
        <h1 className='text-xl text-center uppercase p-2 border-b'>
          Dashboard
        </h1>
        <DashboardList />
      </div>
    </div>
  );
};

export default DashboardPage;
