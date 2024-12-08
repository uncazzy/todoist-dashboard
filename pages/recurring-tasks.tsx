import React from 'react';
import { useSession } from 'next-auth/react';
import RecurringTasksMatrix from '../components/RecurringTasks';
import { useDashboardData } from '../hooks/useDashboardData';
import Layout from '../components/layout/Layout';
import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';
import LoadingIndicator from '../components/LoadingIndicator';

const RecurringTasksPage = () => {
  const { data: session } = useSession();
  const { data, isLoading, loadingProgress, isLoadingFromCache, refreshData } = useDashboardData();

  if (!session) {
    return null;
  }

  return (
    <Layout>
      <div className="overflow-hidden bg-gray-800 p-6 rounded-lg min-h-[80vh] h-full">
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Link href="/" className="flex items-center text-gray-500 hover:text-gray-700 transition-colors no-underline">
              <FaArrowLeft className="w-3 h-3 mr-1" />
              <span>Back</span>
            </Link>
          </div>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-2 flex items-center gap-3 leading-normal">
            Recurring Tasks
          </h1>
          <p className="text-gray-400">
            Track and manage your recurring tasks and habits
          </p>
        </header>

        {loadingProgress && (
          <LoadingIndicator
            loadingProgress={loadingProgress}
            isLoadingFromCache={isLoadingFromCache}
            onRefresh={refreshData}
          />
        )}

        {isLoading || !data ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="bg-gray-800/50 rounded-lg backdrop-blur-sm overflow-hidden">
            <div className="p-6 overflow-x-auto">
              <div className="min-w-[768px]">
                <RecurringTasksMatrix
                  activeTasks={data.activeTasks}
                  allCompletedTasks={data.allCompletedTasks}
                  projectData={data.projectData}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default RecurringTasksPage;