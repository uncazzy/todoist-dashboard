import type { Label } from '../types';

/**
 * Parse labels from completed task content.
 *
 * Todoist appends labels to task content as "@labelname" patterns.
 * Labels can contain spaces (e.g., "@this is a tag").
 *
 * Strategy: Match against known labels list, sorted by length (longest first)
 * to avoid partial matches.
 */
export function parseLabelsFromContent(content: string, validLabels: Label[]): string[] {
  if (!content || validLabels.length === 0) {
    return [];
  }

  const foundLabels: string[] = [];

  // Sort labels by name length (longest first) to avoid partial matches
  // e.g., "@this is a tag" should match before "@this"
  const sortedLabels = [...validLabels].sort((a, b) => b.name.length - a.name.length);

  // Create a working copy of content to mark matched sections
  let remainingContent = content;

  for (const label of sortedLabels) {
    const pattern = `@${label.name}`;
    const escapedPattern = escapeRegex(pattern);
    const boundaryPattern = `(?<!\\S)${escapedPattern}(?=$|[\\s.,!?;:])`;
    const existsRegex = new RegExp(boundaryPattern, 'i');

    if (existsRegex.test(remainingContent)) {
      foundLabels.push(label.name);
      // Remove the matched label to avoid double-counting
      const removeRegex = new RegExp(boundaryPattern, 'gi');
      remainingContent = remainingContent.replace(removeRegex, '');
    }
  }

  return foundLabels;
}

/**
 * Escape special regex characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Get label usage statistics across both active and completed tasks
 */
export function getLabelStats(
  activeTasks: { labels: string[] }[],
  completedTasks: { content: string }[],
  labels: Label[]
): Map<string, { active: number; completed: number; total: number; label: Label }> {
  const stats = new Map<string, { active: number; completed: number; total: number; label: Label }>();

  // Initialize stats for all labels
  for (const label of labels) {
    stats.set(label.name, { active: 0, completed: 0, total: 0, label });
  }

  // Count labels in active tasks
  for (const task of activeTasks) {
    for (const labelName of task.labels) {
      const stat = stats.get(labelName);
      if (stat) {
        stat.active++;
        stat.total++;
      }
    }
  }

  // Count labels in completed tasks (by parsing content)
  for (const task of completedTasks) {
    const taskLabels = parseLabelsFromContent(task.content, labels);
    for (const labelName of taskLabels) {
      const stat = stats.get(labelName);
      if (stat) {
        stat.completed++;
        stat.total++;
      }
    }
  }

  return stats;
}
