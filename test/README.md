# Test Data Generators

This directory contains Python scripts for generating realistic fake Todoist data for development and testing.

## Overview

Testing the Todoist Dashboard requires substantial task completion history. The generators in this directory create realistic datasets that simulate real-world usage patterns.

## Available Generators

### 1. Comprehensive Dataset Generator (`generate_full_dataset.py`)

Generates a complete fake dataset including projects, active tasks, and completed tasks with realistic patterns.

#### Features:
- **Multiple projects** with varied names and colors
- **Active tasks** with:
  - Mixed priorities (P1-P4)
  - Various due dates (overdue, today, this week, later, none)
  - Different ages (to test stale task detection)
  - Recurring and one-off tasks
- **Completed tasks** with realistic patterns:
  - Time-of-day distributions (work hours vs evening)
  - Day-of-week patterns (weekdays vs weekends)
  - Project focus periods (simulates shifting priorities)
  - Seasonal variations
- **User stats** (karma, goals, trends)

#### Usage:

```bash
cd test/scripts
python generate_full_dataset.py [OPTIONS]
```

#### Options:

| Option | Default | Description |
|--------|---------|-------------|
| `--projects` | 6 | Number of projects to generate |
| `--active-tasks` | 75 | Number of active tasks |
| `--completed-tasks` | 1500 | Number of completed tasks |
| `--months` | 12 | Months of history to generate |
| `--output` | `../data/fake-dataset.json` | Output file path |

#### Examples:

Generate default dataset (6 projects, 75 active, 1500 completed, 12 months):
```bash
python generate_full_dataset.py
```

Generate larger dataset for performance testing:
```bash
python generate_full_dataset.py --projects 10 --active-tasks 150 --completed-tasks 3000 --months 24
```

Generate minimal dataset for quick testing:
```bash
python generate_full_dataset.py --projects 3 --active-tasks 25 --completed-tasks 500 --months 6
```

#### Output:

Generates `test/data/fake-dataset.json` with the following structure:

```json
{
  "allCompletedTasks": [...],
  "projectData": [...],
  "activeTasks": [...],
  "totalCompletedTasks": 1500,
  "hasMoreTasks": false,
  "karma": 4221,
  "karmaTrend": "up",
  "karmaRising": true,
  "dailyGoal": 7,
  "weeklyGoal": 40
}
```

### 2. Recurring Tasks Generator (`generate_recurring_tasks.py`)

Generates test data specifically for recurring tasks with various recurrence patterns.

#### Usage:

```bash
cd test/scripts
python generate_recurring_tasks.py [OPTIONS]
```

#### Options:

| Option | Description |
|--------|-------------|
| `--frequency` | Base frequency (daily, weekly, monthly, yearly) |
| `--weekdays` | Specific weekdays (e.g., 'mon,wed,fri') |
| `--interval` | Interval between occurrences |
| `--completion-rate` | Rate of completion (0.0 to 1.0) |
| `--history-days` | Number of days of history |

See the script's help for full options: `python generate_recurring_tasks.py --help`

## Using Fake Data in Development

### Step 1: Generate Dataset

```bash
cd test/scripts
python generate_full_dataset.py --projects 6 --active-tasks 75 --completed-tasks 1500 --months 12
```

### Step 2: Enable Fake Data Mode

Edit `config/dataSource.ts`:

```typescript
export const USE_FAKE_DATA = true;  // Toggle this!
```

### Step 3: Start Development Server

```bash
npm run dev
```

The dashboard will now use fake data instead of the Todoist API.

### Step 4: Switch Back to Real Data

When you're ready to use real data again:

```typescript
export const USE_FAKE_DATA = false;
```

## What Gets Tested

The fake data generator produces patterns that test all dashboard features:

### ✅ Quick Stats
- Active task counts
- Active project counts
- Total completed tasks
- Karma scores and trends

### ✅ Insights Section
- Productivity scores
- Completion rates (daily, weekly, monthly)
- Project distribution
- Weekly progress
- Task completion trends

### ✅ Goal Progress
- 30-day totals
- Daily streaks (current & best)
- Weekly streaks (current & best)

### ✅ Project Velocity & Focus Shifts
- Project focus over time
- Automatic detection of focus shifts (>20% change)

### ✅ Backlog Health
- Overdue tasks (15% of active tasks)
- Stale tasks (30+ days old)
- Health score calculations

### ✅ Completion Patterns Heatmap
- Realistic time-of-day distributions
- Day-of-week patterns
- Project-specific patterns

### ✅ Task Lead Time Analysis
- Distribution across time buckets
- Average and median calculations

### ✅ Recurring Tasks
- Multiple recurrence patterns
- Streak calculations
- Completion calendars

## Data Characteristics

### Realistic Time Patterns

**Work Tasks:**
- Weekdays: Concentrated 9am-6pm
- Weekends: Occasional, distributed

**Personal Tasks:**
- Weekdays: Evening hours (6pm-10pm)
- Weekends: Throughout the day

**Health & Fitness:**
- Morning (7am-9am) for workouts
- Evening for meal prep

### Project Focus Periods

Projects have sinusoidal "focus waves" where activity increases and decreases over time, simulating real-world project prioritization shifts.

### Edge Cases Covered

- ✅ Overdue high-priority tasks (15% of active)
- ✅ Very old tasks (60+ days)
- ✅ Stale unscheduled tasks (30+ days, no due date)
- ✅ Tasks with no due dates (~20% of active)
- ✅ Recurring task completions and streaks
- ✅ Variable daily completion rates
- ✅ Weekend vs weekday patterns
- ✅ Time-of-day productivity variations

## Troubleshooting

### Module Import Errors

If you get import errors when running the generators:

```bash
cd test/scripts
export PYTHONPATH=.
python generate_full_dataset.py
```

### JSON Import Errors in TypeScript

Make sure `tsconfig.json` has `"resolveJsonModule": true` (already configured).

### Emoji/Unicode Errors

The scripts have been configured to avoid emoji output issues on Windows terminals.

## Adding New Test Scenarios

To add new test patterns:

1. Modify `generate_full_dataset.py` to add new task templates
2. Adjust distribution percentages (e.g., overdue rate, priority distribution)
3. Add new project types with custom completion patterns
4. Regenerate the dataset

## Performance

Generating a dataset with 1500 completed tasks typically takes:
- **Generation time:** 2-5 seconds
- **Output file size:** ~1-2 MB
- **Dashboard load time:** Instant (no API calls)

## Future Enhancements

Potential improvements to the test data generators:

- [ ] Subtask generation
- [ ] Task labels and tags
- [ ] Task descriptions with rich content
- [ ] Comments on tasks
- [ ] Project sections
- [ ] Collaborators on shared projects
- [ ] Task dependencies
- [ ] Custom recurrence patterns
- [ ] Seasonal patterns (more tasks in certain months)
- [ ] Work/life balance metrics (overtime detection)

## Contributing

When adding new features to the dashboard, update the test data generators to produce data that exercises those features.
