# Test Directory

This directory contains test data and scripts for the Todoist Dashboard project.

## Directory Structure

- `/data`: Contains generated test data files
  - `test-active-tasks.json`: Active tasks data
  - `test-completed-tasks.json`: Task completion history
  - `test-projects.json`: Project data
  - `test-labels.json`: Label data
  - `test-sections.json`: Section data
- `/scripts`: Test data generation scripts
  - `generate_recurring_tasks.py`: Generate recurring tasks with various patterns

## Recurring Tasks Generator

The `generate_recurring_tasks.py` script helps create test data for recurring tasks with various patterns and completion rates.

### ⚠️ Pattern Support Notice

Not all recurrence patterns are fully supported at this time. Most of the basic ones work fine, but there are others which are not yet supported.


### Basic Usage

```bash
# Simple daily task
python scripts/generate_recurring_tasks.py --frequency daily

# Weekly task on Monday at 2pm
python scripts/generate_recurring_tasks.py --frequency weekly --weekdays monday --time 14:00

# Monthly task on multiple days
python scripts/generate_recurring_tasks.py --frequency monthly --days 1,15,30
```

### Command Line Options

```bash
--frequency FREQ       Base frequency (required)
--time TIME           Time of day (optional)
--days DAYS           Specific days for monthly tasks
--weekdays DAYS       Specific weekdays
--week-number NUM     Week number for monthly patterns
--month MONTH         Month for yearly patterns
--interval N          Interval between occurrences
--strict             Use strict scheduling (!)
--completion-rate N   Task completion rate (0.0 to 1.0)
--history-days N      Days of history to generate
```

### Supported Pattern Examples

#### Daily Patterns
```bash
# Every day
--frequency daily

# Every day at 9am
--frequency daily --time 09:00

# Every workday
--frequency workday

# Every weekend
--frequency weekend

# Every other day
--frequency daily --interval 2

# Every 3 days
--frequency daily --interval 3

# Every day at specific times
--frequency daily --time 09:15    # 9:15am
--frequency daily --time 22:30    # 10:30pm
```

#### Weekly Patterns
```bash
# Every week (random day)
--frequency weekly

# Every Monday
--frequency weekly --weekdays monday

# Every Monday, Wednesday, Friday
--frequency weekly --weekdays "monday,wednesday,friday"

# Every other Monday
--frequency weekly --weekdays monday --interval 2

# Every Monday at 2pm
--frequency weekly --weekdays monday --time 14:00

# Every Mon, Wed at 10am
--frequency weekly --weekdays "monday,wednesday" --time 10:00
```

#### Monthly Patterns
```bash
# Every month on the 1st
--frequency monthly --days 1

# Every month on multiple days
--frequency monthly --days "1,15,30"

# Every month on the last day
--frequency monthly --days last

# Every 2nd Wednesday
--frequency monthly --week-number 2nd --weekdays wednesday

# Every last Tuesday
--frequency monthly --week-number last --weekdays tuesday

# Every other month
--frequency monthly --days 1 --interval 2
```

#### Yearly Patterns
```bash
# Every January 1st
--frequency yearly --month january --days 1

# Every February 14th
--frequency yearly --month february --days 14

# Every October 31st
--frequency yearly --month october --days 31

# Every 2 years
--frequency yearly --month january --days 1 --interval 2
```

### Strict Scheduling

Add `--strict` to any pattern to make it strict (equivalent to "every!"):
```bash
# Every! 3 days
--frequency daily --interval 3 --strict

# Every! 2 weeks
--frequency weekly --interval 2 --strict
```

### Completion Rate

Control how often tasks are marked as completed:
```bash
# 100% completion rate (default)
--completion-rate 1.0

# 70% completion rate
--completion-rate 0.7

# 50% completion rate
--completion-rate 0.5
```

### History Length

Control how many days of history to generate:
```bash
# 6 months of history (default)
--history-days 180

# 1 year of history
--history-days 365

# 1 month of history
--history-days 30
```

## Contributing New Test Data Generators

When adding new test data generators:
1. Create a new script in the `/scripts` directory
2. Update this README with usage instructions
3. Ensure the script follows the same command-line interface pattern
4. Generate data in the `/data` directory with the `test-` prefix
5. Update the main project README if necessary
