import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import RecurringTasksMatrix from '../components/RecurringTasks';
import { useDashboardData } from '../hooks/useDashboardData';
import Layout from '../components/layout/Layout';
import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';
import LoadingIndicator from '../components/LoadingIndicator';
import ProjectPicker from '../components/ProjectPicker';

const RecurringTasksPage = () => {
  const { data: session } = useSession();
  const { data, isLoading, loadingProgress, isLoadingFromCache, refreshData } = useDashboardData();
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);

  if (!session) {
    return null;
  }

  return (
    <Layout>
      <div className="overflow-hidden bg-gray-800 p-2 sm:p-6 rounded-lg min-h-[80vh] h-full flex flex-col">
        <header className="flex-none mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Link href="/" className="flex items-center text-gray-500 hover:text-gray-700 transition-colors no-underline">
              <FaArrowLeft className="w-3 h-3 mr-1" />
              <span>Back</span>
            </Link>
          </div>
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-0 flex items-center gap-3 leading-normal">
                Recurring Tasks
              </h1>
              {data?.projectData && (
                <ProjectPicker
                  projects={data.projectData}
                  selectedProjectIds={selectedProjectIds}
                  onProjectSelect={setSelectedProjectIds}
                />
              )}
            </div>
            <p className="text-gray-400">
              Track and manage your recurring tasks and habits
            </p>
          </div>
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
          <div className="flex-1 overflow-hidden bg-gray-800/50 rounded-lg backdrop-blur-sm">
            <RecurringTasksMatrix
              activeTasks={selectedProjectIds.length > 0
                ? data.activeTasks.filter(task => selectedProjectIds.includes(task.projectId))
                : data.activeTasks}
              allCompletedTasks={data.allCompletedTasks}
              projectData={data.projectData}
            />
          </div>
        )}
      </div>
    </Layout>
  );
};

export default RecurringTasksPage;
