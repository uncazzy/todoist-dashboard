import React, { useState, useRef, useEffect } from 'react';
import { ProjectData, TodoistColor } from '../../types';
import { HiOutlineChevronDown } from 'react-icons/hi';
import { FaHashtag } from "react-icons/fa";
import { motion, AnimatePresence } from 'framer-motion';
import { getColorClass } from '../../utils/projectUtils';
import { trackProjectFilter } from '@/utils/analytics';

interface ProjectPickerProps {
  projects: ProjectData[];
  selectedProjectIds: string[];
  onProjectSelect: (projectIds: string[]) => void;
  fullWidth?: boolean;
}

const ProjectPicker: React.FC<ProjectPickerProps> = ({
  projects,
  selectedProjectIds,
  onProjectSelect,
  fullWidth = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedProjects = projects.filter(p => selectedProjectIds.includes(p.id));
  const isActiveFilter = selectedProjectIds.length > 0;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleProject = (projectId: string) => {
    const isRemoving = selectedProjectIds.includes(projectId);
    const newSelection = isRemoving
      ? selectedProjectIds.filter(id => id !== projectId)
      : [...selectedProjectIds, projectId];
    onProjectSelect(newSelection);

    // Track the filter change
    trackProjectFilter(newSelection.length, isRemoving ? 'remove' : 'add');
  };

  return (
    <div className={`relative ${isOpen ? 'z-50' : 'z-10'}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2.5 sm:py-2 text-sm rounded-lg transition-colors duration-200 border backdrop-blur-sm ${fullWidth ? 'w-full' : 'w-full sm:w-auto sm:min-w-[160px]'} justify-between ${isActiveFilter
          ? 'bg-warm-peach/10 hover:bg-warm-peach/20 border-warm-peach text-warm-peach'
          : 'bg-warm-hover hover:bg-warm-card border-warm-border text-white'
          }`}
        aria-label="Filter by projects">
        <div className="flex items-center gap-2 min-w-0">
          <FaHashtag className="w-4 h-4 flex-shrink-0" />
          <span>
            {selectedProjects.length === 0
              ? 'All Projects'
              : selectedProjects.length === 1
                ? '1 Project'
                : `${selectedProjects.length} Projects`}
          </span>
        </div>
        <HiOutlineChevronDown
          className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''
            }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={`absolute left-0 top-full mt-2 py-2 bg-warm-card rounded-lg shadow-lg border border-warm-border ${fullWidth ? 'right-0 w-full' : 'sm:right-0 w-full sm:w-72'}`}
          >
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
              {projects.map((project) => (
                <label
                  key={project.id}
                  className="flex items-start gap-3 w-full px-4 py-2 hover:bg-warm-hover transition-colors duration-200 cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-[24px] pt-0.5">
                    <input
                      type="checkbox"
                      checked={selectedProjectIds.includes(project.id)}
                      onChange={() => toggleProject(project.id)}
                      className="rounded border-warm-border bg-warm-hover text-warm-peach focus:ring-warm-peach focus:ring-offset-warm-card"
                    />
                  </div>
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    <div
                      className={`bg-${getColorClass(project.color as TodoistColor)} w-3 h-3 rounded-sm flex-shrink-0 mt-1`}
                    />
                    <span className="text-white break-words">{project.name}</span>
                  </div>
                </label>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProjectPicker;
