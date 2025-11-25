#!/usr/bin/env python3
"""
Date Range Filter Test Data Generator

Generates test data specifically for testing date range filtering functionality.
Creates tasks distributed across specific time periods: 7 days, 30 days, 90 days, 6 months, 1 year.

Usage:
    python generate_date_filter_test_data.py
    python generate_date_filter_test_data.py --output ../data/date-filter-test.json
"""

import json
import random
import argparse
from datetime import datetime, timedelta
from typing import List, Dict, Tuple

# Simple project templates for testing
TEST_PROJECTS = [
    {"name": "Work", "color": "blue"},
    {"name": "Personal", "color": "green"},
    {"name": "Learning", "color": "purple"},
]

# Task content templates
TASK_CONTENTS = [
    "Review pull request",
    "Team meeting",
    "Buy groceries",
    "Call dentist",
    "Morning workout",
    "Read chapter 5",
    "Fix bug",
    "Write documentation",
    "Plan weekend",
    "Update dependencies",
]

# Todoist color palette
TODOIST_COLORS = [
    "berry_red", "red", "orange", "yellow", "olive_green", "lime_green",
    "green", "mint_green", "teal", "sky_blue", "light_blue", "blue",
    "grape", "violet", "lavender", "magenta", "salmon", "charcoal",
    "grey", "taupe"
]


def parse_args():
    parser = argparse.ArgumentParser(description="Generate date filter test data")
    parser.add_argument("--output", type=str, default="../data/date-filter-test.json", help="Output file path")
    return parser.parse_args()


def generate_id(length: int = 10) -> str:
    """Generate random numeric ID"""
    return ''.join(random.choices('0123456789', k=length))


def generate_v2_id() -> str:
    """Generate v2 format ID"""
    return ''.join(random.choices('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', k=16))


def generate_projects() -> List[Dict]:
    """Generate test projects"""
    projects = []
    for i, template in enumerate(TEST_PROJECTS):
        project_id = generate_id()
        projects.append({
            "id": project_id,
            "name": template["name"],
            "color": random.choice(TODOIST_COLORS),
            "commentCount": 0,
            "isShared": False,
            "isFavorite": i == 0,
            "isInboxProject": i == 0,
            "isTeamInbox": False,
            "order": i + 1,
            "parentId": None,
            "url": f"https://todoist.com/showProject?id={project_id}",
            "viewStyle": "list"
        })
    return projects


def generate_completed_task(project_id: str, completion_datetime: datetime, lead_time_days: int = None) -> Tuple[Dict, int, datetime]:
    """Generate a single completed task"""
    task_id = generate_id()
    content = random.choice(TASK_CONTENTS)

    # Task was created before completion (1-30 days lead time)
    if lead_time_days is None:
        lead_time_days = random.randint(1, 30)
    
    created_at = completion_datetime - timedelta(days=lead_time_days, hours=random.randint(0, 23))

    return {
        "completed_at": completion_datetime.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
        "content": content,
        "id": generate_id(),
        "item_object": None,
        "meta_data": None,
        "note_count": 0,
        "notes": [],
        "project_id": project_id,
        "section_id": None,
        "task_id": task_id,
        "user_id": "test_user_123",
        "v2_project_id": generate_v2_id(),
        "v2_section_id": None,
        "v2_task_id": generate_v2_id()
    }, lead_time_days, created_at


def generate_active_task_for_completed(task_id: str, project_id: str, content: str, created_at: datetime) -> Dict:
    """Generate matching active task entry for completed task (for lead time calculation)"""
    return {
        "id": task_id,
        "content": content,
        "createdAt": created_at.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
        "projectId": project_id,
        "priority": random.randint(1, 4),
    }


def distribute_tasks_in_period(count: int, start_date: datetime, end_date: datetime) -> List[datetime]:
    """Evenly distribute tasks across a date range"""
    if count == 0:
        return []

    total_seconds = int((end_date - start_date).total_seconds())
    dates = []

    for i in range(count):
        # Distribute evenly with some randomness
        progress = (i + 0.5) / count
        offset_seconds = int(progress * total_seconds)
        # Add some random jitter (±20% of interval)
        jitter = random.randint(-int(total_seconds * 0.1 / count), int(total_seconds * 0.1 / count))
        offset_seconds = max(0, min(offset_seconds + jitter, total_seconds))

        task_date = start_date + timedelta(seconds=offset_seconds)

        # Set realistic time of day (9am-9pm)
        hour = random.randint(9, 21)
        minute = random.choice([0, 15, 30, 45])
        task_date = task_date.replace(hour=hour, minute=minute, second=0, microsecond=0)

        dates.append(task_date)

    return sorted(dates)


def main():
    args = parse_args()

    print("\nGenerating date filter test data...")
    print("=" * 50)

    # Generate projects
    projects = generate_projects()
    print(f"Generated {len(projects)} projects")

    # Current time (end of all ranges)
    now = datetime.now()

    # Define time periods for testing
    time_periods = [
        {"name": "Last 7 days", "days": 7, "count": 10},
        {"name": "8-30 days ago", "days_start": 8, "days_end": 30, "count": 15},
        {"name": "31-90 days ago", "days_start": 31, "days_end": 90, "count": 20},
        {"name": "91-180 days ago (6 months)", "days_start": 91, "days_end": 180, "count": 25},
        {"name": "181-365 days ago (1 year)", "days_start": 181, "days_end": 365, "count": 30},
    ]

    completed_tasks = []
    matching_active_tasks = []

    print("\nGenerating tasks for each time period:")
    print("-" * 50)

    for period in time_periods:
        if "days_start" in period:
            start_date = now - timedelta(days=period["days_end"])
            end_date = now - timedelta(days=period["days_start"])
        else:
            start_date = now - timedelta(days=period["days"])
            end_date = now

        # Distribute tasks across this period
        task_dates = distribute_tasks_in_period(period["count"], start_date, end_date)

        # Generate tasks
        for task_date in task_dates:
            project = random.choice(projects)
            task, lead_time_days, created_at = generate_completed_task(project["id"], task_date)
            completed_tasks.append(task)

            # Create matching active task (for lead time calculation)
            active_task = generate_active_task_for_completed(
                task["task_id"],
                project["id"],
                task["content"],
                created_at
            )
            matching_active_tasks.append(active_task)

        print(f"  {period['name']:30} -> {period['count']:3} tasks ({start_date.date()} to {end_date.date()})")

    # Sort completed tasks by date (oldest first)
    completed_tasks.sort(key=lambda x: x["completed_at"])

    # Generate user stats
    user_stats = {
        "karma": random.randint(1000, 5000),
        "karmaTrend": "up",
        "karmaRising": True,
        "dailyGoal": 10,
        "weeklyGoal": 50
    }

    # Combine into dataset
    dataset = {
        "allCompletedTasks": completed_tasks,
        "projectData": projects,
        "activeTasks": matching_active_tasks,
        "totalCompletedTasks": len(completed_tasks),
        "hasMoreTasks": False,
        **user_stats
    }

    # Write to file
    print(f"\nWriting to {args.output}...")
    with open(args.output, 'w') as f:
        json.dump(dataset, f, indent=2)

    print("\n" + "=" * 50)
    print("Successfully generated date filter test data!")
    print("=" * 50)
    print("\nSummary:")
    print(f"   - Total tasks: {len(completed_tasks)}")
    print(f"   - Projects: {len(projects)}")
    print(f"   - Date range: {completed_tasks[0]['completed_at'][:10]} to {completed_tasks[-1]['completed_at'][:10]}")
    print(f"   - Output: {args.output}")

    print("\nBreakdown by time period:")
    total_so_far = 0
    for period in time_periods:
        total_so_far += period["count"]
        print(f"   - {period['name']:30} -> {period['count']:3} tasks (total: {total_so_far})")

    print("\nTo use this test data:")
    print("   1. Toggle USE_FAKE_DATA in config/dataSource.ts")
    print("   2. Update FAKE_DATA_PATH to point to this file")
    print("   3. Test each date range filter preset:")
    print("      - Last 7 days:  Should show ~10 tasks")
    print("      - Last 30 days: Should show ~25 tasks (10 + 15)")
    print("      - Last 90 days: Should show ~45 tasks (10 + 15 + 20)")
    print("      - Last 6 months: Should show ~70 tasks (10 + 15 + 20 + 25)")
    print("      - Last year: Should show ~100 tasks (all)")
    print()


if __name__ == "__main__":
    main()
