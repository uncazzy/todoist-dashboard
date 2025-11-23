/**
 * Data Source Configuration
 *
 * Toggle between real Todoist API data and fake test data.
 *
 * Usage:
 *   - Set to `true` to use fake test data
 *   - Set to `false` to use real Todoist API data (requires authentication)
 *
 * Note: Fake data is useful for:
 *   - Testing dashboard features without a Todoist account
 *   - Developing new features with realistic data patterns
 *   - Testing edge cases (overdue tasks, stale tasks, streaks, etc.)
 *   - Performance testing with large datasets
 */
export const USE_FAKE_DATA = false;

/**
 * Path to fake dataset file (relative to project root)
 *
 * Generate new fake data using:
 *   cd test/scripts
 *   python generate_full_dataset.py --projects 6 --active-tasks 75 --completed-tasks 1500 --months 12
 */
export const FAKE_DATA_PATH = './test/data/fake-dataset.json';
