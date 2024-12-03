export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type DayName = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

const daysOfWeek: readonly DayName[] = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export function getDayOfWeekName(dayOfWeek: DayOfWeek): DayName {
  const name = daysOfWeek[dayOfWeek];
  if (name === undefined) {
    throw new Error(`Invalid day of week: ${dayOfWeek}`);
  }
  return name;
}
