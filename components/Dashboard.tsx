import React, { useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { Tooltip } from 'react-tooltip';
import ActiveTasksByProject from './ActiveTasksByProject';
import CompletedTasksByProject from './CompletedTasksByProject';
import { ProductivityScore, InsightsSummary, CompletionTrends } from './Insights';
import GoalProgress from './GoalProgress';
import RecentlyCompletedList from './RecentlyCompleted/RecentlyCompletedList';
import CompletedTasksOverTime from './CompletedTasksOverTime';
import TaskPriority from './TaskPriority';
import BacklogHealth from './BacklogHealth';
import CompletedByTimeOfDay from './CompletedByTimeOfDay';
import { SiTodoist } from 'react-icons/si';
import { HiX } from 'react-icons/hi';
import CompletionStreak from './CompletionStreak';
import TaskWordCloud from './TaskWordCloud';
import RecurringTasksPreview from './RecurringTasks/RecurringTasksPreview';
import { MAX_TASKS } from '../utils/constants';
import QuestionMark from './shared/QuestionMark';
import LoadingIndicator from './shared/LoadingIndicator';
import QuickStats from './QuickStats/QuickStats';
import { useDashboardData } from '../hooks/useDashboardData';
import { useDashboardPreferences } from '../hooks/useDashboardPreferences';
import Layout from './layout/Layout';
import ProjectPicker from './ProjectPicker';
import DateRangePicker from './DateRangePicker';
import TaskLeadTime from './TaskLeadTime';
import ProjectVelocity from './ProjectVelocity';
import CompletionHeatmap from './CompletionHeatmap';
import ExportButton from './Export/ExportButton';
import ExportModal from './Export/ExportModal';
import { VisibilityButton, VisibilityModal } from './VisibilitySettings';
import { useExportSection } from '../hooks/useExportManager';
import { filterCompletedTasksByDateRange } from '../utils/filterByDateRange';
import { startOfDay, endOfDay, subDays } from 'date-fns';
import LabelDistribution, { LabelViewMode } from './LabelDistribution';

export default function Dashboard(): JSX.Element {
  const { status } = useSession();
  const { preferences, updatePreferences, clearPreferences } = useDashboardPreferences();
  const { selectedProjectIds, dateRange, visibleSections } = preferences;
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isVisibilityModalOpen, setIsVisibilityModalOpen] = useState(false);
  const [labelViewMode, setLabelViewMode] = useState<LabelViewMode>('all');

  // Helper to check if a section is visible
  // Empty array means all sections are visible
  const isSectionVisible = (sectionId: string) => {
    return visibleSections.length === 0 || visibleSections.includes(sectionId);
  };
  const {
    data,
    isLoading,
    error,
    loadingProgress,
    isLoadingFromCache,
    refreshData
  } = useDashboardData();

  // Register export sections
  const quickStatsRef = useExportSection('quick-stats', 'Quick Stats');
  const productivityScoreRef = useExportSection('productivity-score', 'Productivity Score & Key Metrics');
  const goalProgressRef = useExportSection('goal-progress', 'Goal Progress');
  const insightsSummaryRef = useExportSection('insights-summary', 'Completion Rates & Weekly Progress');
  const completionTrendsRef = useExportSection('completion-trends', 'Task Completion Trends');
  const projectVelocityRef = useExportSection('project-velocity', 'Project Velocity & Focus Shifts');
  const recentlyCompletedBacklogRef = useExportSection('recently-completed-backlog', 'Recently Completed & Backlog Health');
  const recurringTasksRef = useExportSection('recurring-tasks', 'Recurring Tasks');
  const taskManagementRef = useExportSection('task-management', 'Tasks by Priority & Active Tasks by Project');
  const completedTasksRef = useExportSection('completed-tasks', 'Completed Tasks Over Time & By Project');
  const completionHeatmapRef = useExportSection('completion-heatmap', 'Completion Patterns Heatmap');
  const dailyStatsRef = useExportSection('daily-stats', 'Daily Streak & Activity Pattern');
  const taskLeadTimeRef = useExportSection('task-lead-time', 'Task Lead Time Analysis');
  const taskTopicsRef = useExportSection('task-topics', 'Task Topics');
  const labelDistributionRef = useExportSection('label-distribution', 'Tasks by Label');

  // Compute filtered data (must be before early returns for hooks rules)
  const { projectData = [], allCompletedTasks = [], activeTasks = [] } = data || {};
  const needsFullData = data?.hasMoreTasks || false;

  // Filter by project (active tasks are not date-filtered, only completed tasks)
  const filteredActiveTasks = useMemo(() => {
    return selectedProjectIds.length > 0
      ? activeTasks?.filter(task => selectedProjectIds.includes(task.projectId)) || []
      : activeTasks || [];
  }, [activeTasks, selectedProjectIds]);

  const projectFilteredCompletedTasks = useMemo(() => {
    return selectedProjectIds.length > 0
      ? allCompletedTasks?.filter(task => selectedProjectIds.includes(task.project_id)) || []
      : allCompletedTasks || [];
  }, [allCompletedTasks, selectedProjectIds]);

  // Apply date range filter to completed tasks
  const filteredCompletedTasks = useMemo(() => {
    return filterCompletedTasksByDateRange(projectFilteredCompletedTasks, dateRange);
  }, [projectFilteredCompletedTasks, dateRange]);

  const filteredProjects = useMemo(() => {
    return selectedProjectIds.length > 0
      ? projectData?.filter(project => selectedProjectIds.includes(project.id)) || []
      : projectData || [];
  }, [projectData, selectedProjectIds]);

  // Compute projects with completed task counts (memoized for performance)
  const projectsWithCounts = useMemo(() => {
    return filteredProjects.map(project => ({
      ...project,
      completedTasksCount: filteredCompletedTasks.filter(
        task => task.project_id === project.id
      ).length,
    }));
  }, [filteredProjects, filteredCompletedTasks]);

  // Calculate week-over-week comparison (uses project filter only, ignores date filter)
  const weeklyComparison = useMemo(() => {
    const now = new Date();
    const today = endOfDay(now);
    const sevenDaysAgo = startOfDay(subDays(now, 6));
    const fourteenDaysAgo = startOfDay(subDays(now, 13));
    const eightDaysAgo = endOfDay(subDays(now, 7));

    const thisWeek = projectFilteredCompletedTasks.filter(task => {
      const date = new Date(task.completed_at);
      return date >= sevenDaysAgo && date <= today;
    }).length;

    const lastWeek = projectFilteredCompletedTasks.filter(task => {
      const date = new Date(task.completed_at);
      return date >= fourteenDaysAgo && date <= eightDaysAgo;
    }).length;

    const percentChange = lastWeek > 0
      ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100)
      : thisWeek > 0 ? 100 : 0;

    return { thisWeek, lastWeek, percentChange };
  }, [projectFilteredCompletedTasks]);

  if (status !== 'authenticated') {
    return (
      <Layout title="Dashboard | Todoist Dashboard" description="View your Todoist analytics and insights">
        <div className="p-6 bg-warm-card border border-warm-border rounded-2xl">
          <p className="text-warm-gray">Please sign in to view your dashboard.</p>
        </div>
      </Layout>
    );
  }

  if (isLoading && (!loadingProgress || loadingProgress.total === 0)) {
    return (
      <Layout title="Dashboard | Todoist Dashboard" description="View your Todoist analytics and insights">
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-4">Loading your dashboard...</h2>
            {loadingProgress && loadingProgress.total > 0 && (
              <div className="text-warm-gray">
                Loaded {loadingProgress.loaded} out of {Math.min(MAX_TASKS, loadingProgress.total)}{' '}
                tasks
                {loadingProgress.total > MAX_TASKS && (
                  <span className="text-warm-gray/70"> ({loadingProgress.total} total available)</span>
                )}
              </div>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Dashboard | Todoist Dashboard" description="View your Todoist analytics and insights">
        <div className="p-6 bg-warm-peach/10 border border-warm-peach/30 rounded-lg">
          <h3 className="text-xl font-semibold text-warm-peach mb-2">Error Loading Dashboard</h3>
          <p className="text-warm-gray mb-4">{error}</p>
          <button
            onClick={refreshData}
            className="px-4 py-2 bg-warm-peach hover:opacity-90 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout title="Dashboard | Todoist Dashboard" description="View your Todoist analytics and insights">
        <div className="p-6 bg-warm-card border border-warm-border rounded-2xl">
          <p className="text-warm-gray">No data available. Please check your Todoist connection.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard | Todoist Dashboard" description="View your Todoist analytics and insights">
      <div className="min-h-screen bg-warm-black">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
          <header className="mb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-6">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                  <SiTodoist className="text-warm-peach" />
                  Todoist Dashboard
                </h1>
                <p className="text-warm-gray text-sm">Your productivity at a glance</p>
              </div>
              <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
                {/* Filter Controls Group */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 p-2 sm:p-1 bg-warm-card/50 border border-warm-border/50 rounded-xl backdrop-blur-sm w-full sm:w-auto">
                  {data?.projectData && (
                    <ProjectPicker
                      projects={data.projectData}
                      selectedProjectIds={selectedProjectIds}
                      onProjectSelect={(ids) => updatePreferences({ selectedProjectIds: ids })}
                    />
                  )}
                  <DateRangePicker
                    dateRange={dateRange}
                    onDateRangeChange={(range) => updatePreferences({ dateRange: range })}
                  />
                  {(selectedProjectIds.length > 0 || dateRange.preset !== 'all') && (
                    <>
                      <div className="w-full h-px sm:w-px sm:h-6 bg-warm-border" />
                      <button
                        onClick={clearPreferences}
                        className="flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-2 text-sm font-medium text-white bg-warm-hover hover:bg-warm-peach hover:text-white border border-warm-border hover:border-warm-peach rounded-lg transition-all duration-200 w-full sm:w-auto"
                        aria-label="Reset all filters"
                        data-tooltip-id="dashboard-tooltip"
                        data-tooltip-content="Clear both project and date filters to show all data"
                      >
                        <HiX className="w-3.5 h-3.5" />
                        Reset
                      </button>
                    </>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                  <VisibilityButton
                    onClick={() => setIsVisibilityModalOpen(true)}
                    disabled={isLoading || !data}
                  />
                  <ExportButton
                    onClick={() => setIsExportModalOpen(true)}
                    disabled={isLoading || !data}
                  />
                </div>
              </div>
            </div>
          </header>

          {/* Always show loading indicator */}
          <LoadingIndicator
            loading={isLoading}
            loadingMore={false}
            loadingProgress={loadingProgress || { loaded: 0, total: 0 }}
            isLoadingFromCache={isLoadingFromCache}
            onRefresh={refreshData}
            loadError={data?.loadError}
          />

          {/* Quick Stats */}
          {isSectionVisible('quick-stats') && (
            <div ref={quickStatsRef}>
              <QuickStats
                activeTasks={filteredActiveTasks}
                projectCount={selectedProjectIds.length || data?.projectData?.length || 0}
                totalCompletedTasks={filteredCompletedTasks.length}
                karma={data?.karma || 0}
                karmaTrend={data?.karmaTrend || 'none'}
                karmaRising={data?.karmaRising || false}
                weeklyComparison={weeklyComparison}
              />
            </div>
          )}

          {/* Main Content Grid */}
          <div className="space-y-6 mt-6">
            {/* Productivity Score & Key Metrics */}
            {isSectionVisible('productivity-score') && (
              <div ref={productivityScoreRef}>
                <ProductivityScore
                  completedTasks={filteredCompletedTasks}
                  loading={isLoading}
                />
              </div>
            )}

            {/* Goal Progress */}
            {isSectionVisible('goal-progress') && (
              <div className="bg-warm-card border border-warm-border p-6 rounded-2xl" ref={goalProgressRef}>
                <h3 className="text-xl font-semibold mb-6 text-white">Goal Progress</h3>
                <GoalProgress allData={data} />
              </div>
            )}

            {/* Insights Summary (Completion Rates, Project Distribution, Weekly Progress) */}
            {isSectionVisible('insights-summary') && (
              <div ref={insightsSummaryRef}>
                <InsightsSummary
                  completedTasks={filteredCompletedTasks}
                  projectData={filteredProjects}
                  loading={isLoading}
                />
              </div>
            )}

            {/* Task Completion Trends */}
            {isSectionVisible('completion-trends') && (
              <div ref={completionTrendsRef}>
                <CompletionTrends
                  completedTasks={filteredCompletedTasks}
                  loading={isLoading}
                />
              </div>
            )}

            {/* Project Velocity & Focus Drift */}
            {isSectionVisible('project-velocity') && (
              <div className="bg-warm-card border border-warm-border rounded-2xl p-6 sm:p-8 hover:bg-warm-hover transition-colors" ref={projectVelocityRef}>
                <h2 className="text-2xl font-semibold text-white mb-6">
                  Project Velocity & Focus Shifts
                  <QuestionMark content="Shows how your focus shifts between projects over time. Analyze your project velocity (tasks completed per period) and focus drift (percentage of total effort per project)." />
                </h2>
                <ProjectVelocity
                  completedTasks={filteredCompletedTasks}
                  projectData={filteredProjects}
                  loading={needsFullData}
                />
              </div>
            )}

            {/* Recently Completed and Backlog Health - 2 Column Layout */}
            {isSectionVisible('recently-completed-backlog') && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" ref={recentlyCompletedBacklogRef}>
                <div className="bg-warm-card border border-warm-border rounded-2xl p-6 hover:bg-warm-hover transition-colors">
                  <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                    Recently Completed
                    <span className="text-2xl">✅</span>
                  </h2>
                  <RecentlyCompletedList
                    allData={{
                      ...data,
                      allCompletedTasks: filteredCompletedTasks
                    }}
                  />
                </div>

                <div className="bg-warm-card border border-warm-border rounded-2xl p-6 hover:bg-warm-hover transition-colors">
                  <h2 className="text-xl font-semibold text-white mb-6">
                    Backlog Health
                    <QuestionMark content="Health score based on task age, overdue status, and due dates. Shows tasks needing attention: overdue tasks, very old tasks (60+ days), old unscheduled tasks (30+ days), and high-priority tasks without due dates." />
                  </h2>
                  <BacklogHealth
                    activeTasks={filteredActiveTasks}
                    completedTasks={filteredCompletedTasks}
                    projectData={filteredProjects}
                  />
                </div>
              </div>
            )}

            {/* Recurring Tasks Section */}
            {isSectionVisible('recurring-tasks') && (
              <div className="bg-warm-card border border-warm-border rounded-2xl p-6 hover:bg-warm-hover transition-colors" ref={recurringTasksRef}>
                <div className="flex items-center mb-6">
                  <h2 className="text-xl font-semibold text-white">
                    Recurring Tasks
                    <QuestionMark content="Track your recurring tasks and habits. View completion rates, streaks, and trends." />
                  </h2>
                </div>
                {needsFullData ? (
                  <div className="flex justify-center items-center h-48">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-warm-peach"></div>
                  </div>
                ) : (
                  <RecurringTasksPreview
                    activeTasks={filteredActiveTasks}
                    allCompletedTasks={filteredCompletedTasks}
                  />
                )}
              </div>
            )}

            {/* Task Management Section - 2 Column Layout */}
            {isSectionVisible('task-management') && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" ref={taskManagementRef}>
                <div className={`bg-warm-card border border-warm-border rounded-2xl p-6 transition-opacity ${needsFullData ? 'opacity-50' : ''}`}>
                  <h2 className="text-xl font-semibold text-white mb-6">
                    Tasks by Priority
                  </h2>
                  <TaskPriority
                    activeTasks={filteredActiveTasks}
                    loading={needsFullData}
                  />
                </div>

                <div className={`bg-warm-card border border-warm-border rounded-2xl p-6 transition-opacity ${needsFullData ? 'opacity-50' : ''}`}>
                  <h2 className="text-xl font-semibold text-white mb-6">
                    Active Tasks by Project
                  </h2>
                  <ActiveTasksByProject
                    projectData={filteredProjects}
                    activeTasks={filteredActiveTasks}
                    loading={needsFullData}
                  />
                </div>
              </div>
            )}

            {/* Completed Tasks over time and by project - 2 Column Layout */}
            {isSectionVisible('completed-tasks') && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" ref={completedTasksRef}>
                <div className={`bg-warm-card border border-warm-border rounded-2xl p-6 transition-opacity ${needsFullData ? 'opacity-50' : ''}`}>
                  <h2 className="text-xl font-semibold text-white mb-6">
                    Completed Tasks Over Time
                  </h2>
                  <CompletedTasksOverTime
                    allData={filteredCompletedTasks}
                    loading={isLoading}
                  />
                </div>

                <div className={`flex flex-col bg-warm-card border border-warm-border rounded-2xl p-6 transition-opacity ${needsFullData ? 'opacity-50' : ''}`}>
                  <h2 className="text-xl font-semibold text-white mb-6">
                    Completed Tasks by Project
                  </h2>
                  <CompletedTasksByProject
                    projectData={projectsWithCounts}
                    loading={needsFullData}
                  />
                </div>
              </div>
            )}

            {/* Label Distribution */}
            {isSectionVisible('label-distribution') && (
              <div className="bg-warm-card border border-warm-border rounded-2xl p-6 sm:p-8" ref={labelDistributionRef}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl sm:text-2xl font-semibold text-white">
                    Tasks by Label
                    <QuestionMark content="Distribution of tasks across your labels. Shows both active and completed tasks for each label." />
                  </h2>
                  <div className="inline-flex items-center bg-warm-hover rounded-lg p-0.5 text-xs">
                    <button
                      onClick={() => setLabelViewMode('all')}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        labelViewMode === 'all'
                          ? 'bg-warm-card text-white'
                          : 'text-warm-gray hover:text-white'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setLabelViewMode('active')}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        labelViewMode === 'active'
                          ? 'bg-warm-card text-white'
                          : 'text-warm-gray hover:text-white'
                      }`}
                    >
                      Active
                    </button>
                  </div>
                </div>
                <LabelDistribution
                  activeTasks={filteredActiveTasks}
                  completedTasks={filteredCompletedTasks}
                  labels={data?.labels || []}
                  loading={needsFullData}
                  viewMode={labelViewMode}
                />
              </div>
            )}

            {/* Completion Heatmap */}
            {isSectionVisible('completion-heatmap') && (
              <div className="bg-warm-card border border-warm-border rounded-2xl p-6 sm:p-8" ref={completionHeatmapRef}>
                <h2 className="text-xl sm:text-2xl font-semibold text-white mb-6">
                  Completion Patterns Heatmap
                  <QuestionMark content="Visualization of when you typically complete tasks by day of week and time of day. Identify your most productive times and optimize your schedule accordingly." />
                </h2>
                <CompletionHeatmap
                  completedTasks={filteredCompletedTasks}
                  loading={needsFullData}
                />
              </div>
            )}

            {/* Daily Stats - 2 Column Layout */}
            {isSectionVisible('daily-stats') && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" ref={dailyStatsRef}>
                <div className={`bg-warm-card border border-warm-border rounded-2xl p-6 transition-opacity ${needsFullData ? 'opacity-50' : ''}`}>
                  <h2 className="text-xl font-semibold text-white mb-6">
                    Daily Streak
                  </h2>
                  <CompletionStreak
                    allData={{
                      allCompletedTasks: filteredCompletedTasks
                    }}
                  />
                </div>

                <div className={`bg-warm-card border border-warm-border rounded-2xl p-6 transition-opacity ${needsFullData ? 'opacity-50' : ''}`}>
                  <h2 className="text-xl font-semibold text-white mb-6">
                    Daily Activity Pattern
                  </h2>
                  <CompletedByTimeOfDay
                    allData={{
                      ...data,
                      allCompletedTasks: filteredCompletedTasks
                    }}
                    loading={needsFullData}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Task Lead Time Analysis */}
          {isSectionVisible('task-lead-time') && (
            <div className="bg-warm-card border border-warm-border rounded-2xl p-6 sm:p-8 mt-8" ref={taskLeadTimeRef}>
              <h2 className="text-xl sm:text-2xl font-semibold text-white mb-6">
                Task Lead Time Analysis
                <QuestionMark content="Cycle time analysis showing how long tasks take from creation to completion. This helps identify bottlenecks in your workflow and set expectations for different types of tasks." />
              </h2>
              <TaskLeadTime
                completedTasks={filteredCompletedTasks}
                activeTasks={filteredActiveTasks}
                loading={needsFullData}
              />
            </div>
          )}

          {/* Task Topics Section */}
          {isSectionVisible('task-topics') && (
            <div className="bg-warm-card border border-warm-border rounded-2xl p-6 my-8" ref={taskTopicsRef}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl sm:text-2xl font-semibold text-white">
                  Task Topics
                  <QuestionMark content="Shows the most common topics in your tasks" />
                </h2>
              </div>
              {needsFullData ? (
                <div className="flex justify-center items-center h-48">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-warm-peach"></div>
                </div>
              ) : (
                <TaskWordCloud
                  tasks={[...filteredActiveTasks, ...filteredCompletedTasks]}
                />
              )}
            </div>
          )}
        </div>
        <Tooltip
          id="dashboard-tooltip"
          place="top"
          className="z-50 max-w-xs text-center"
          noArrow={true}
          positionStrategy="fixed"
          openOnClick={true}
        />

        {/* Export Modal */}
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
        />

        {/* Visibility Modal */}
        <VisibilityModal
          isOpen={isVisibilityModalOpen}
          onClose={() => setIsVisibilityModalOpen(false)}
          visibleSections={visibleSections}
          onVisibleSectionsChange={(sections) => updatePreferences({ visibleSections: sections })}
        />
      </div>
    </Layout>
  );
}
