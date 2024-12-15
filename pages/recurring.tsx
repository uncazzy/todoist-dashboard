import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import RecurringTasksCard from '../components/RecurringTasks';
import { useDashboardData } from '../hooks/useDashboardData';
import Layout from '../components/layout/Layout';
import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';
import LoadingIndicator from '../components/shared/LoadingIndicator';
import ProjectPicker from '../components/ProjectPicker';

const RecurringTasksPage = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { data, isLoading, loadingProgress, isLoadingFromCache, refreshData } = useDashboardData();
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [showBetaTooltip, setShowBetaTooltip] = useState(false);

  // Handle loading state
  if (status === "loading") {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[80vh]">
          <div className="text-xl">Loading...</div>
        </div>
      </Layout>
    );
  }

  // Redirect if not authenticated
  if (!session) {
    router.push('/sign-in');
    return null;
  }

  return (
    <Layout title="Recurring Tasks | Todoist Dashboard" description="Track and manage your recurring tasks and habits">
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
              <div>
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-2 flex items-center gap-3 leading-normal">
                  Recurring Tasks
                </h1>

                {/* Beta indicator */}
                <div className="relative inline-block">
                  <span
                    className="ml-0 px-2 py-1 text-xs font-semibold text-blue-100 bg-blue-500/30 rounded-full border border-blue-400/50 hover:bg-blue-500/40 transition-colors cursor-pointer"
                    onClick={() => setShowBetaTooltip(!showBetaTooltip)}
                  >
                    Beta
                  </span>
                  {showBetaTooltip && (
                    <div className="absolute z-20 mt-2 p-3 w-64 bg-gray-700 text-white text-sm rounded-lg shadow-lg border border-gray-600">
                      <p className="mb-2">
                        Handling complex recurring task patterns can be challenging, so some variations might not render correctly. Performance may also vary with extensive recurring tasks.
                      </p>
                      <p className="mb-2">
                        Please report any inconsistencies or issues you encounter.
                      </p>
                      <a
                        href="mailto:todoist-dashboard@azzy.cloud?subject=Todoist%20Dashboard%20Feedback"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 block text-blue-300 hover:text-blue-200 underline"
                      >
                        Report Issues or Suggest Features
                      </a>
                    </div>
                  )}
                </div>

              </div>
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
            loading={isLoading}
            loadingMore={false}
            loadingProgress={loadingProgress || { loaded: 0, total: 0 }}
            isLoadingFromCache={isLoadingFromCache}
            onRefresh={refreshData}
            loadError={data?.loadError}
          />
        )}

        {isLoading || !data ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden bg-gray-800/50 rounded-lg backdrop-blur-sm">
            <RecurringTasksCard
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
