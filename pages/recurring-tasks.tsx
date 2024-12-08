import React from 'react';
import { useSession } from 'next-auth/react';
import RecurringTasksMatrix from '../components/RecurringTasks';
import { useDashboardData } from '../hooks/useDashboardData';
import Layout from '../components/layout/Layout';

const RecurringTasksPage = () => {
  const { data: session } = useSession();
  const { data, isLoading } = useDashboardData();

  if (!session) {
    return null;
  }

  return (
    <Layout session={session}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Recurring Tasks</h1>
        </div>
        
        {isLoading || !data ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg">
            <div className="p-6">
              <div className="space-y-6">
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
