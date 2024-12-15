import { ProjectData, TodoistColor } from '../types';

interface ProjectInfo {
  projectName: string;
  projectColor: TodoistColor;
}

interface ColorMapping {
  tailwind: string;
  hex: string;
}

const DEFAULT_PROJECT: ProjectInfo = {
  projectName: 'No Project',
  projectColor: 'grey' as TodoistColor
};

const DELETED_PROJECT: ProjectInfo = {
  projectName: 'Deleted Project',
  projectColor: 'grey' as TodoistColor
};

const colors: Record<TodoistColor, ColorMapping> = {
  berry_red: { tailwind: "pink-700", hex: "#b8256f" },
  red: { tailwind: "red-600", hex: "#db4035" },
  orange: { tailwind: "orange-400", hex: "#ff9933" },
  yellow: { tailwind: "yellow-400", hex: "#fad000" },
  olive_green: { tailwind: "lime-600", hex: "#afb83b" },
  lime_green: { tailwind: "lime-500", hex: "#7ecc49" },
  green: { tailwind: "green-600", hex: "#299438" },
  mint_green: { tailwind: "teal-400", hex: "#6accbc" },
  teal: { tailwind: "cyan-600", hex: "#158fad" },
  sky_blue: { tailwind: "sky-500", hex: "#14aaf5" },
  light_blue: { tailwind: "blue-300", hex: "#96c3eb" },
  blue: { tailwind: "blue-500", hex: "#4073ff" },
  grape: { tailwind: "purple-500", hex: "#884dff" },
  violet: { tailwind: "fuchsia-600", hex: "#af38eb" },
  lavender: { tailwind: "fuchsia-300", hex: "#eb96eb" },
  magenta: { tailwind: "pink-500", hex: "#e05194" },
  salmon: { tailwind: "red-400", hex: "#ff8d85" },
  charcoal: { tailwind: "neutral-500", hex: "#808080" },
  grey: { tailwind: "neutral-400", hex: "#b8b8b8" },
  taupe: { tailwind: "stone-400", hex: "#ccac93" },
} as const;

export function getProjectById(projectId: string | null, projectData: ProjectData[] = []): ProjectInfo {
  if (!projectId || !projectData) {
    return DEFAULT_PROJECT;
  }

  const project = projectData.find(
    (project) => project.id === projectId
  );

  return project
    ? { 
        projectName: project.name, 
        projectColor: (project.color || 'grey') as TodoistColor
      }
    : DELETED_PROJECT;
}

export function getColorClass(color: TodoistColor | null): string {
  if (!color) return "bg-gray-400";
  return colors[color].tailwind;
}

export function colorNameToHex(color: TodoistColor | null, opacity?: string): string | null {
  if (!color) return null;
  const hex = colors[color].hex;
  if (!hex) return null;
  return opacity ? hex + opacity : hex;
}
