import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';

// Current version number
const APP_VERSION = '0.8.0';

// Changelog entries - newest first
const CHANGELOG = [
  {
    version: '0.8.0',
    date: 'October 2025',
    changes: [
      'Added HTML export feature with section selection',
      'Upgraded Next.js to v15.5.2',
      'Upgraded Axios to v1.12.2',
    ]
  },
  {
    version: '0.7.0',
    date: 'April 2025',
    changes: [
      'Added Task Lead Time Analysis to identify workflow bottlenecks',
      'Added Project Velocity & Focus Shifts visualization',
      'Added Completion Heatmap showing day/hour patterns',
      'Improved filtering performance for large task collections',
      'Added version info and changelog'
    ]
  },
  {
    version: '0.6.0',
    date: 'January 2025',
    changes: [
      'Added project filtering to the Dashboard, allowing users to view metrics and statistics for specific projects, similar to the Recurring Tasks page'
    ]
  },
  {
    version: '0.5.1',
    date: 'January 2025',
    changes: [
      'Security updates for Next.js, todoist API, PostCSS, and other dependencies'
    ]
  },
  {
    version: '0.5.0',
    date: 'December 2024',
    changes: [
      'New Feature: Recurring Tasks Page (Beta)',
      'Dedicated page for analyzing recurring tasks with categorization by recurrence types',
      '6-month calendar view with completion percentages, trend lines, and streak tracking',
      'Project-based filtering for focused insights',
      'Improved error handling for task fetching',
      'The app now loads partially if task-fetching fails',
      'Fixed an issue with redirecting users when already logged in'
    ]
  },
  {
    version: '0.1.0',
    date: 'December 2024',
    changes: [
      'Initial beta release of Todoist Dashboard',
      'Task completion patterns by time of day',
      'Productivity trends and scoring',
      'Project distribution analysis',
      'Exportable and printable task summaries',
      'Responsive design for desktop and mobile'
    ]
  }
];

const VersionInfo: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  
  return (
    <>
      <span
        className="text-xs text-gray-600 hover:text-gray-400 cursor-pointer transition-colors"
        onClick={() => setShowModal(true)}
        title="View changelog"
      >
        v{APP_VERSION}
      </span>
      
      {/* Changelog Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-70 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-xl">
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white">Changelog</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="p-5">
              {CHANGELOG.map((release) => (
                <div key={release.version} className="mb-6 last:mb-0">
                  <div className="flex justify-between items-baseline mb-2">
                    <h3 className="text-lg font-medium text-blue-400">v{release.version}</h3>
                    <span className="text-sm text-gray-400">{release.date}</span>
                  </div>
                  <ul className="list-disc ml-5 space-y-1">
                    {release.changes.map((change, index) => (
                      <li key={index} className="text-gray-300 text-sm">{change}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            
            <div className="border-t border-gray-700 p-4 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VersionInfo; 