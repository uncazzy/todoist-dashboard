import { ProjectData, TodoistColor } from '../types';

interface ProjectInfo {
  projectName: string;
  projectColor: TodoistColor;
}

const DEFAULT_PROJECT: ProjectInfo = {
  projectName: 'No Project',
  projectColor: 'grey' as TodoistColor
};

const DELETED_PROJECT: ProjectInfo = {
  projectName: 'Deleted Project',
  projectColor: 'grey' as TodoistColor
};

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

const colors: Record<TodoistColor, string> = {
  berry_red: "#b8256f",
  red: "#db4035",
  orange: "#ff9933",
  yellow: "#fad000",
  olive_green: "#afb83b",
  lime_green: "#7ecc49",
  green: "#299438",
  mint_green: "#6accbc",
  teal: "#158fad",
  sky_blue: "#14aaf5",
  light_blue: "#96c3eb",
  blue: "#4073ff",
  grape: "#884dff",
  violet: "#af38eb",
  lavender: "#eb96eb",
  magenta: "#e05194",
  salmon: "#ff8d85",
  charcoal: "#808080",
  grey: "#b8b8b8",
  taupe: "#ccac93",
} as const;

export function colorNameToHex(color: TodoistColor | null, opacity?: string): string | null {
  if (!color) return null;
  const hex = colors[color];
  if (!hex) return null;
  return opacity ? hex + opacity : hex;
}
