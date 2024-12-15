export function getKarmaLevel(karma: number): string {
  if (karma >= 50000) return 'Enlightened';
  if (karma >= 20000) return 'Grand Master';
  if (karma >= 10000) return 'Master';
  if (karma >= 7500) return 'Expert';
  if (karma >= 5000) return 'Professional';
  if (karma >= 2500) return 'Intermediate';
  if (karma >= 500) return 'Novice';
  return 'Beginner';
}
