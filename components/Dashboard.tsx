import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import { Tooltip } from 'react-tooltip';
import { SiTodoist } from 'react-icons/si';
import { HiX } from 'react-icons/hi';
import { AnimatePresence } from 'framer-motion';
import { startOfDay, endOfDay, subDays } from 'date-fns';

// Static imports — lightweight / above-the-fold
import QuickStats from './QuickStats/QuickStats';
import { ProductivityScore, InsightsSummary, CompletionTrends } from './Insights';
import GoalProgress from './GoalProgress';
import RecentlyCompletedList from './RecentlyCompleted/RecentlyCompletedList';
import BacklogHealth from './BacklogHealth';
import CompletionStreak from './CompletionStreak';
import RecurringTasksPreview from './RecurringTasks/RecurringTasksPreview';

// Dynamic imports — heavy chart components (code-split)
const CompletedTasksOverTime = dynamic(() => import('./CompletedTasksOverTime'), { ssr: false });
const CompletionHeatmap = dynamic(() => import('./CompletionHeatmap'), { ssr: false });
const CompletedByTimeOfDay = dynamic(() => import('./CompletedByTimeOfDay'), { ssr: false });
const ProjectVelocity = dynamic(() => import('./ProjectVelocity'), { ssr: false });
const CompletedTasksByProject = dynamic(() => import('./CompletedTasksByProject'), { ssr: false });
const ActiveTasksByProject = dynamic(() => import('./ActiveTasksByProject'), { ssr: false });
const TaskPriority = dynamic(() => import('./TaskPriority'), { ssr: false });
const LabelDistribution = dynamic(() => import('./LabelDistribution').then(mod => ({ default: mod.default })), { ssr: false });
const TaskWordCloud = dynamic(() => import('./TaskWordCloud'), { ssr: false });
const TaskLeadTime = dynamic(() => import('./TaskLeadTime'), { ssr: false });

// Layout & shared
import { MAX_TASKS } from '../utils/constants';
import QuestionMark from './shared/QuestionMark';
import LoadingIndicator from './shared/LoadingIndicator';
import LazySection from './shared/LazySection';
import { useDashboardData } from '../hooks/useDashboardData';
import { useDashboardPreferences } from '../hooks/useDashboardPreferences';
import Layout from './layout/Layout';
import ProjectPicker from './ProjectPicker';
import DateRangePicker from './DateRangePicker';
import ExportButton from './Export/ExportButton';
import ExportModal from './Export/ExportModal';
import { VisibilityButton, VisibilityModal } from './VisibilitySettings';
import { MobileControlsFAB, MobileControlsSheet } from './MobileControls';
import { useExportSection } from '../hooks/useExportManager';
import { filterCompletedTasksByDateRange } from '../utils/filterByDateRange';
import { type LabelViewMode } from './LabelDistribution';
import { trackEvent, trackChartInteraction } from '@/utils/analytics';
import { calculateComparisonPeriod } from '../utils/comparisonPeriod';
import SectionGroupHeader from './shared/SectionGroupHeader';
import Spinner from './shared/Spinner';
import DumplingBanner from './DumplingBanner';

export default function Dashboard(): JSX.Element {
  const { status } = useSession();
  const { preferences, updatePreferences, clearPreferences } = useDashboardPreferences();
  const { selectedProjectIds, dateRange, visibleSections } = preferences;
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isVisibilityModalOpen, setIsVisibilityModalOpen] = useState(false);
  const [isMobileControlsOpen, setIsMobileControlsOpen] = useState(false);
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

  // Period-over-period comparison (available when a date range is selected)
  const comparisonPeriod = useMemo(() => {
    return calculateComparisonPeriod(dateRange);
  }, [dateRange]);

  const comparisonCompletedTasks = useMemo(() => {
    if (!comparisonPeriod) return undefined;
    return filterCompletedTasksByDateRange(
      projectFilteredCompletedTasks,
      comparisonPeriod.previous
    );
  }, [projectFilteredCompletedTasks, comparisonPeriod]);

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
            <h2 className="text-2xl font-semibold mb-2">Loading your dashboard...</h2>
            <p className="text-sm text-warm-gray mb-4">Gathering your productivity insights</p>
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
        <div className="p-6 bg-warm-danger/10 border border-warm-danger/30 rounded-lg">
          <h3 className="text-xl font-semibold text-warm-danger mb-2">Error Loading Dashboard</h3>
          <p className="text-warm-gray mb-4">{error}</p>
          <button
            type="button"
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
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 flex items-center gap-3">
                  <SiTodoist className="text-warm-peach" />
                  Todoist Dashboard
                </h1>
                <p className="text-warm-gray text-sm">
                  {weeklyComparison.thisWeek > 0
                    ? `You completed ${weeklyComparison.thisWeek} task${weeklyComparison.thisWeek !== 1 ? 's' : ''} this week${
                        weeklyComparison.percentChange !== 0 && weeklyComparison.lastWeek > 0
                          ? ` \u2014 ${Math.abs(weeklyComparison.percentChange)}% ${weeklyComparison.percentChange > 0 ? 'more' : 'fewer'} than last week`
                          : ''
                      }`
                    : 'Your productivity at a glance'}
                </p>
              </div>
              {/* Desktop Controls - hidden on mobile */}
              <div className="hidden sm:flex sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
                {/* Filter Controls Group */}
                <div className="flex flex-row items-center gap-3 p-1 bg-warm-card/50 border border-warm-border/50 rounded-xl w-auto">
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
                      <div className="w-px h-6 bg-warm-border" />
                      <button
                        type="button"
                        onClick={() => {
                          trackEvent('filter_reset_all', {});
                          clearPreferences();
                        }}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-warm-hover hover:bg-warm-peach hover:text-white border border-warm-border hover:border-warm-peach rounded-lg transition-all duration-200"
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
                <div className="flex flex-row gap-3">
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

          <DumplingBanner />

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
          <LazySection
            sectionId="quick-stats"
            exportRef={quickStatsRef}
            visible={isSectionVisible('quick-stats')}
            eager
            minHeight={120}
          >
            <QuickStats
              activeTasks={filteredActiveTasks}
              projectCount={selectedProjectIds.length || data?.projectData?.length || 0}
              totalCompletedTasks={filteredCompletedTasks.length}
              karma={data?.karma || 0}
              karmaTrend={data?.karmaTrend || 'none'}
              karmaRising={data?.karmaRising || false}
              weeklyComparison={weeklyComparison}
            />
          </LazySection>

          {/* Main Content Grid */}
          <div className="space-y-6 mt-6">
            {/* Productivity Score & Key Metrics */}
            <LazySection
              sectionId="productivity-score"
              exportRef={productivityScoreRef}
              visible={isSectionVisible('productivity-score')}
              eager
              minHeight={200}
            >
              <ProductivityScore
                completedTasks={filteredCompletedTasks}
                loading={isLoading}
              />
            </LazySection>

            {/* Goal Progress */}
            <LazySection
              sectionId="goal-progress"
              exportRef={goalProgressRef}
              visible={isSectionVisible('goal-progress')}
              eager
              minHeight={200}
            >
              <div className="bg-warm-card border border-warm-border p-6 sm:p-8 rounded-2xl">
                <h3 className="text-xl sm:text-2xl font-semibold mb-6 text-white">Goal Progress</h3>
                <GoalProgress allData={data} />
              </div>
            </LazySection>

            {(isSectionVisible('insights-summary') || isSectionVisible('completion-trends')) && (
              <SectionGroupHeader label="Insights & Trends" />
            )}

            {/* Insights Summary (Completion Rates, Project Distribution, Weekly Progress) */}
            <LazySection
              sectionId="insights-summary"
              exportRef={insightsSummaryRef}
              visible={isSectionVisible('insights-summary')}
              minHeight={300}
            >
              <InsightsSummary
                completedTasks={filteredCompletedTasks}
                projectData={filteredProjects}
                loading={isLoading}
              />
            </LazySection>

            {/* Task Completion Trends */}
            <LazySection
              sectionId="completion-trends"
              exportRef={completionTrendsRef}
              visible={isSectionVisible('completion-trends')}
              minHeight={400}
            >
              <CompletionTrends
                completedTasks={filteredCompletedTasks}
                loading={isLoading}
                comparisonTasks={comparisonCompletedTasks}
              />
            </LazySection>

            {(isSectionVisible('project-velocity') || isSectionVisible('recently-completed-backlog') || isSectionVisible('recurring-tasks') || isSectionVisible('task-management') || isSectionVisible('completed-tasks') || isSectionVisible('label-distribution')) && (
              <SectionGroupHeader label="Projects & Tasks" />
            )}

            {/* Project Velocity & Focus Drift */}
            <LazySection
              sectionId="project-velocity"
              exportRef={projectVelocityRef}
              visible={isSectionVisible('project-velocity')}
              minHeight={400}
            >
              <div className="bg-warm-card border border-warm-border rounded-2xl p-6 sm:p-8 hover:bg-warm-hover transition-colors">
                <h2 className="text-xl sm:text-2xl font-semibold text-white mb-1">
                  Project Velocity & Focus Shifts
                  <QuestionMark content="Shows how your focus shifts between projects over time. Analyze your project velocity (tasks completed per period) and focus drift (percentage of total effort per project)." />
                </h2>
                <div className="text-sm text-warm-gray mb-6">How your focus shifts between projects over time</div>
                <ProjectVelocity
                  completedTasks={filteredCompletedTasks}
                  projectData={filteredProjects}
                  loading={needsFullData}
                  comparisonTasks={comparisonCompletedTasks}
                />
              </div>
            </LazySection>

            {/* Recently Completed and Backlog Health - 2 Column Layout */}
            <LazySection
              sectionId="recently-completed-backlog"
              exportRef={recentlyCompletedBacklogRef}
              visible={isSectionVisible('recently-completed-backlog')}
              minHeight={400}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              <div className="bg-warm-card border border-warm-border rounded-2xl p-6 hover:bg-warm-hover transition-colors">
                <h2 className="text-xl sm:text-2xl font-semibold text-white mb-6 flex items-center gap-2">
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
                <h2 className="text-xl sm:text-2xl font-semibold text-white mb-1">
                  Backlog Health
                  <QuestionMark content="Health score based on task age, overdue status, and due dates. Shows tasks needing attention: overdue tasks, very old tasks (60+ days), old unscheduled tasks (30+ days), and high-priority tasks without due dates." />
                </h2>
                <div className="text-sm text-warm-gray mb-6">Task age, overdue status, and items needing attention</div>
                <BacklogHealth
                  activeTasks={filteredActiveTasks}
                  completedTasks={filteredCompletedTasks}
                  projectData={filteredProjects}
                />
              </div>
            </LazySection>

            {/* Recurring Tasks Section */}
            <LazySection
              sectionId="recurring-tasks"
              exportRef={recurringTasksRef}
              visible={isSectionVisible('recurring-tasks')}
              minHeight={300}
            >
              <div className="bg-warm-card border border-warm-border rounded-2xl p-6 sm:p-8 hover:bg-warm-hover transition-colors">
                <h2 className="text-xl sm:text-2xl font-semibold text-white mb-1">
                  Recurring Tasks
                  <QuestionMark content="Track your recurring tasks and habits. View completion rates, streaks, and trends." />
                </h2>
                <div className="text-sm text-warm-gray mb-6">Completion rates, streaks, and habit consistency</div>
                {needsFullData ? (
                  <div className="flex justify-center items-center h-48">
                    <Spinner />
                  </div>
                ) : (
                  <RecurringTasksPreview
                    activeTasks={filteredActiveTasks}
                    allCompletedTasks={filteredCompletedTasks}
                  />
                )}
              </div>
            </LazySection>

            {/* Task Management Section - 2 Column Layout */}
            <LazySection
              sectionId="task-management"
              exportRef={taskManagementRef}
              visible={isSectionVisible('task-management')}
              minHeight={400}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              <div className={`bg-warm-card border border-warm-border rounded-2xl p-6 transition-opacity ${needsFullData ? 'opacity-50' : ''}`}>
                <h2 className="text-xl sm:text-2xl font-semibold text-white mb-6">
                  Tasks by Priority
                </h2>
                <TaskPriority
                  activeTasks={filteredActiveTasks}
                  loading={needsFullData}
                />
              </div>

              <div className={`bg-warm-card border border-warm-border rounded-2xl p-6 transition-opacity ${needsFullData ? 'opacity-50' : ''}`}>
                <h2 className="text-xl sm:text-2xl font-semibold text-white mb-6">
                  Active Tasks by Project
                </h2>
                <ActiveTasksByProject
                  projectData={filteredProjects}
                  activeTasks={filteredActiveTasks}
                  loading={needsFullData}
                />
              </div>
            </LazySection>

            {/* Completed Tasks over time and by project - 2 Column Layout */}
            <LazySection
              sectionId="completed-tasks"
              exportRef={completedTasksRef}
              visible={isSectionVisible('completed-tasks')}
              minHeight={400}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              <div className={`bg-warm-card border border-warm-border rounded-2xl p-6 transition-opacity ${needsFullData ? 'opacity-50' : ''}`}>
                <h2 className="text-xl sm:text-2xl font-semibold text-white mb-6">
                  Completed Tasks Over Time
                </h2>
                <CompletedTasksOverTime
                  allData={filteredCompletedTasks}
                  loading={isLoading}
                  comparisonData={comparisonCompletedTasks}
                />
              </div>

              <div className={`flex flex-col bg-warm-card border border-warm-border rounded-2xl p-6 transition-opacity ${needsFullData ? 'opacity-50' : ''}`}>
                <h2 className="text-xl sm:text-2xl font-semibold text-white mb-6">
                  Completed Tasks by Project
                </h2>
                <CompletedTasksByProject
                  projectData={projectsWithCounts}
                  loading={needsFullData}
                />
              </div>
            </LazySection>

            {/* Label Distribution */}
            <LazySection
              sectionId="label-distribution"
              exportRef={labelDistributionRef}
              visible={isSectionVisible('label-distribution')}
              minHeight={400}
            >
              <div className="bg-warm-card border border-warm-border rounded-2xl p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl sm:text-2xl font-semibold text-white">
                    Tasks by Label
                    <QuestionMark content="Distribution of tasks across your labels. Shows both active and completed tasks for each label." />
                  </h2>
                  <div className="inline-flex items-center bg-warm-hover rounded-lg p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setLabelViewMode('all');
                        trackChartInteraction('label_distribution', 'view_change', 'all');
                      }}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        labelViewMode === 'all'
                          ? 'bg-warm-card text-white'
                          : 'text-warm-gray hover:text-white'
                      }`}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLabelViewMode('active');
                        trackChartInteraction('label_distribution', 'view_change', 'active');
                      }}
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
            </LazySection>

            {(isSectionVisible('completion-heatmap') || isSectionVisible('daily-stats') || isSectionVisible('task-lead-time') || isSectionVisible('task-topics')) && (
              <SectionGroupHeader label="Deep Dives" />
            )}

            {/* Completion Heatmap */}
            <LazySection
              sectionId="completion-heatmap"
              exportRef={completionHeatmapRef}
              visible={isSectionVisible('completion-heatmap')}
              minHeight={400}
            >
              <div className="bg-warm-card border border-warm-border rounded-2xl p-6 sm:p-8">
                <h2 className="text-xl sm:text-2xl font-semibold text-white mb-1">
                  Completion Patterns Heatmap
                  <QuestionMark content="Visualization of when you typically complete tasks by day of week and time of day. Identify your most productive times and optimize your schedule accordingly." />
                </h2>
                <div className="text-sm text-warm-gray mb-6">When you typically complete tasks by day and time</div>
                <CompletionHeatmap
                  completedTasks={filteredCompletedTasks}
                  loading={needsFullData}
                />
              </div>
            </LazySection>

            {/* Daily Stats - 2 Column Layout */}
            <LazySection
              sectionId="daily-stats"
              exportRef={dailyStatsRef}
              visible={isSectionVisible('daily-stats')}
              minHeight={350}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              <div className={`bg-warm-card border border-warm-border rounded-2xl p-6 transition-opacity ${needsFullData ? 'opacity-50' : ''}`}>
                <h2 className="text-xl sm:text-2xl font-semibold text-white mb-6">
                  Daily Streak
                </h2>
                <CompletionStreak
                  allData={{
                    allCompletedTasks: filteredCompletedTasks
                  }}
                />
              </div>

              <div className={`bg-warm-card border border-warm-border rounded-2xl p-6 transition-opacity ${needsFullData ? 'opacity-50' : ''}`}>
                <h2 className="text-xl sm:text-2xl font-semibold text-white mb-6">
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
            </LazySection>
          </div>

          {/* Task Lead Time Analysis */}
          <LazySection
            sectionId="task-lead-time"
            exportRef={taskLeadTimeRef}
            visible={isSectionVisible('task-lead-time')}
            minHeight={400}
            className="mt-8"
          >
            <div className="bg-warm-card border border-warm-border rounded-2xl p-6 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-semibold text-white mb-1">
                Task Lead Time Analysis
                <QuestionMark content="Cycle time analysis showing how long tasks take from creation to completion. This helps identify bottlenecks in your workflow and set expectations for different types of tasks." />
              </h2>
              <div className="text-sm text-warm-gray mb-6">How long tasks take from creation to completion</div>
              <TaskLeadTime
                completedTasks={filteredCompletedTasks}
                activeTasks={filteredActiveTasks}
                loading={needsFullData}
              />
            </div>
          </LazySection>

          {/* Task Topics Section */}
          <LazySection
            sectionId="task-topics"
            exportRef={taskTopicsRef}
            visible={isSectionVisible('task-topics')}
            minHeight={400}
            className="my-8"
          >
            <div className="bg-warm-card border border-warm-border rounded-2xl p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl sm:text-2xl font-semibold text-white">
                  Task Topics
                  <QuestionMark content="Shows the most common topics in your tasks" />
                </h2>
              </div>
              {needsFullData ? (
                <div className="flex justify-center items-center h-48">
                  <Spinner />
                </div>
              ) : (
                <TaskWordCloud
                  tasks={[...filteredActiveTasks, ...filteredCompletedTasks]}
                />
              )}
            </div>
          </LazySection>
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

        {/* Mobile Controls FAB - hidden when sheet is open */}
        <AnimatePresence>
          {!isMobileControlsOpen && (
            <MobileControlsFAB
              onClick={() => setIsMobileControlsOpen(true)}
              hasActiveFilters={selectedProjectIds.length > 0 || dateRange.preset !== 'all'}
            />
          )}
        </AnimatePresence>

        {/* Mobile Controls Bottom Sheet */}
        <MobileControlsSheet
          isOpen={isMobileControlsOpen}
          onClose={() => setIsMobileControlsOpen(false)}
        >
          <div className="space-y-6 p-4 pb-8">
            {/* Section 1: Filters */}
            <section>
              <h3 className="text-sm font-medium text-warm-gray mb-3">Filters</h3>
              <div className="space-y-3">
                {data?.projectData && (
                  <ProjectPicker
                    projects={data.projectData}
                    selectedProjectIds={selectedProjectIds}
                    onProjectSelect={(ids) => updatePreferences({ selectedProjectIds: ids })}
                    fullWidth
                  />
                )}
                <DateRangePicker
                  dateRange={dateRange}
                  onDateRangeChange={(range) => updatePreferences({ dateRange: range })}
                  fullWidth
                />
                {(selectedProjectIds.length > 0 || dateRange.preset !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      trackEvent('filter_reset_all', {});
                      clearPreferences();
                      setIsMobileControlsOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-warm-peach bg-warm-hover border border-warm-peach/30 rounded-lg hover:bg-warm-peach/10 transition-colors"
                  >
                    <HiX className="w-4 h-4" />
                    Reset All Filters
                  </button>
                )}
              </div>
            </section>

            {/* Section 2: Actions */}
            <section className="pt-4 border-t border-warm-border">
              <h3 className="text-sm font-medium text-warm-gray mb-3">Actions</h3>
              <div className="flex flex-col gap-3">
                <VisibilityButton
                  onClick={() => {
                    setIsMobileControlsOpen(false);
                    setIsVisibilityModalOpen(true);
                  }}
                  disabled={isLoading || !data}
                />
                <ExportButton
                  onClick={() => {
                    setIsMobileControlsOpen(false);
                    setIsExportModalOpen(true);
                  }}
                  disabled={isLoading || !data}
                />
              </div>
            </section>
          </div>
        </MobileControlsSheet>
      </div>
    </Layout>
  );
}
