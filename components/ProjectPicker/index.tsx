import React, { useState, useRef, useEffect } from 'react';
import { ProjectData, TodoistColor } from '../../types';
import { HiOutlineChevronDown } from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';
import { getColorClass } from '../../utils/projectUtils';

interface ProjectPickerProps {
  projects: ProjectData[];
  selectedProjectIds: string[];
  onProjectSelect: (projectIds: string[]) => void;
}

const ProjectPicker: React.FC<ProjectPickerProps> = ({
  projects,
  selectedProjectIds,
  onProjectSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedProjects = projects.filter(p => selectedProjectIds.includes(p.id));

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
    const newSelection = selectedProjectIds.includes(projectId)
      ? selectedProjectIds.filter(id => id !== projectId)
      : [...selectedProjectIds, projectId];
    onProjectSelect(newSelection);
  };

  return (
    <div className="relative z-10 mr-4" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 text-sm bg-warm-hover hover:bg-warm-card rounded-lg transition-colors duration-200 border border-warm-border backdrop-blur-sm min-w-[160px]">
        <span className="text-white">
          {selectedProjects.length === 0
            ? 'All Projects'
            : selectedProjects.length === 1
            ? '1 Project'
            : `${selectedProjects.length} Projects`}
        </span>
        <HiOutlineChevronDown
          className={`w-4 h-4 text-warm-gray transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
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
            className="absolute left:0 sm:right-0 mt-2 w-72 py-2 bg-warm-card rounded-lg shadow-lg border border-warm-border backdrop-blur-sm"
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
