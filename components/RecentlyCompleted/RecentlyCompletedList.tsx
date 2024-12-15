import { useState } from "react";
import TimeFrame from "./TimeFrame";
import Pagination from "./Pagination";
import Tasks from "./Tasks";
import { DashboardData, CompletedTask } from "../../types";
import { parseISO, isToday, subDays, isAfter } from "date-fns";

interface TaskWithProject {
  task: CompletedTask;
  projectId: string;
}

interface RecentlyCompletedListProps {
  allData: DashboardData;
}

export default function RecentlyCompletedList({ allData }: RecentlyCompletedListProps) {
  const { projectData, allCompletedTasks } = allData;
  const [currentFilter, setCurrentFilter] = useState<'today' | 'week' | 'month'>("today");
  const tasksCompletedToday: TaskWithProject[] = [];
  const tasksCompletedThisWeek: TaskWithProject[] = [];
  const tasksCompletedThisMonth: TaskWithProject[] = [];
  const [isPrinting, setIsPrinting] = useState(false);

  if (allCompletedTasks) {
    const now = new Date();
    const sevenDaysAgo = subDays(now, 7);
    const thirtyDaysAgo = subDays(now, 30);

    allCompletedTasks.forEach((task) => {
      // Skip tasks without a valid completed_at date
      if (typeof task.completed_at !== 'string') return;
      
      const completedDate = parseISO(task.completed_at);
      const projectId = task.project_id;
      
      // Today's tasks - using isToday which handles timezone correctly
      if (isToday(completedDate)) {
        tasksCompletedToday.push({
          task,
          projectId,
        });
      }
      
      // Last 7 days tasks
      if (isAfter(completedDate, sevenDaysAgo)) {
        tasksCompletedThisWeek.push({
          task,
          projectId,
        });
      }
      
      // Last 30 days tasks
      if (isAfter(completedDate, thirtyDaysAgo)) {
        tasksCompletedThisMonth.push({
          task,
          projectId,
        });
      }
    });
  }

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  let totalPages = 0;
  let tasksToDisplay: TaskWithProject[] = [];
  let numOfTasks: number;

  if (currentFilter === "today") {
    totalPages = Math.ceil(tasksCompletedToday.length / itemsPerPage);
    tasksToDisplay = tasksCompletedToday;
    numOfTasks = tasksCompletedToday.length;
  } else if (currentFilter === "week") {
    totalPages = Math.ceil(tasksCompletedThisWeek.length / itemsPerPage);
    tasksToDisplay = tasksCompletedThisWeek;
    numOfTasks = tasksCompletedThisWeek.length;
  } else {
    totalPages = Math.ceil(tasksCompletedThisMonth.length / itemsPerPage);
    tasksToDisplay = tasksCompletedThisMonth;
    numOfTasks = tasksCompletedThisMonth.length;
  }

  const handleFilterClick = (filter: 'today' | 'week' | 'month') => {
    setCurrentFilter(filter);
    setCurrentPage(1);
  };

  const getPageItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return tasksToDisplay.slice(startIndex, endIndex);
  };

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };

  return (
    <div
      id="recentlyCompleted"
      className="bg-gray-900 p-4 rounded-xl shadow-lg flex flex-col print:bg-white print:shadow-none print:p-0"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <TimeFrame
          currentFilter={currentFilter}
          handleFilterClick={handleFilterClick}
          numOfTasks={numOfTasks}
        />
        <button
          onClick={handlePrint}
          className="hidden sm:flex px-4 py-2 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 items-center space-x-2 print:hidden"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      <div className="flex flex-col min-h-[400px] md:p-6 print:p-0">
        <div className="print:mb-8 print:border-b print:border-gray-200 print:pb-4">
          <h1 className="hidden print:block print:text-3xl print:font-bold print:mb-2">
            Completed Tasks -{" "}
            {currentFilter === "today" ? "Today" : currentFilter === "week" ? "This Week" : "This Month"}
          </h1>
          <p className="hidden print:block print:text-gray-600">
            Generated on{" "}
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {/* Show paginated view for screen */}
        <div className={isPrinting ? 'hidden' : ''}>
          <Tasks getPageItems={getPageItems} projectData={projectData} groupByProject={false} />
        </div>

        {/* Show all tasks grouped by project for print */}
        <div className={!isPrinting ? 'hidden' : ''}>
          <Tasks
            getPageItems={() => tasksToDisplay}
            projectData={projectData}
            groupByProject={true}
          />
        </div>

        <div className="flex items-center justify-between mt-4 relative">
          {totalPages > 1 && !isPrinting && (
            <div className="flex items-center justify-center flex-1">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                setCurrentPage={setCurrentPage}
              />
            </div>
          )}
          <button
            onClick={handlePrint}
            className="sm:hidden px-4 py-2 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 flex items-center space-x-2 print:hidden ml-auto"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .bg-gray-900 {
            background-color: white !important;
          }
          .text-gray-300, .text-gray-500 {
            color: #374151 !important;
          }
          #recentlyCompleted, #recentlyCompleted * {
            visibility: visible;
          }
          #recentlyCompleted {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 2rem !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .group-hover\\:text-white {
            color: #111827 !important;
          }
          .group-hover\\:text-gray-400 {
            color: #4B5563 !important;
          }
        }
      `}</style>
    </div>
  );
}
