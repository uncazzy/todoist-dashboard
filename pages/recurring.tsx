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
      <div className="min-h-screen bg-warm-black">
        <div className="container mx-auto px-6 py-8 max-w-7xl">
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Link href="/" className="flex items-center text-warm-gray hover:text-warm-peach transition-colors no-underline group">
                <FaArrowLeft className="w-3 h-3 mr-2 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-medium">Back to Dashboard</span>
              </Link>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-4 mb-3">
                  <h1 className="text-4xl font-bold text-white">
                    Recurring Tasks
                  </h1>
                  {/* Beta indicator */}
                  <div className="relative">
                    <button
                      className="px-3 py-1 text-xs font-semibold text-white bg-warm-blue/30 rounded-full border border-warm-blue/50 hover:bg-warm-blue/40 transition-all cursor-pointer"
                      onClick={() => setShowBetaTooltip(!showBetaTooltip)}
                    >
                      Beta
                    </button>
                    {showBetaTooltip && (
                      <div className="absolute z-20 mt-3 p-4 w-72 bg-warm-card border border-warm-border text-white text-sm rounded-2xl shadow-xl">
                        <p className="mb-3">
                          Handling complex recurring task patterns can be challenging, so some variations might not render correctly. Performance may also vary with extensive recurring tasks.
                        </p>
                        <p className="mb-3 text-warm-gray text-xs">
                          Please report any inconsistencies or issues you encounter.
                        </p>
                        <a
                          href="mailto:todoist-dashboard@azzy.cloud?subject=Todoist%20Dashboard%20Feedback"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-warm-peach hover:text-warm-peach/80 underline text-sm font-medium"
                        >
                          Report Issues or Suggest Features
                        </a>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-warm-gray text-sm">
                  Track and manage your recurring tasks and habits
                </p>
              </div>

              {data?.projectData && (
                <ProjectPicker
                  projects={data.projectData}
                  selectedProjectIds={selectedProjectIds}
                  onProjectSelect={setSelectedProjectIds}
                />
              )}
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
            <div className="flex justify-center items-center h-96">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-warm-peach"></div>
            </div>
          ) : (
            <div className="bg-warm-card border border-warm-border rounded-2xl overflow-hidden">
              <RecurringTasksCard
                activeTasks={selectedProjectIds.length > 0
                  ? data.activeTasks.filter(task => selectedProjectIds.includes(task.projectId))
                  : data.activeTasks}
                allCompletedTasks={selectedProjectIds.length > 0
                  ? data.allCompletedTasks.filter(task => selectedProjectIds.includes(task.project_id))
                  : data.allCompletedTasks}
                projectData={data.projectData}
              />
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default RecurringTasksPage;
