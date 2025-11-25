#!/usr/bin/env python3
"""
Comprehensive Todoist Test Data Generator

Generates realistic dummy data for testing the Todoist Dashboard including:
- Multiple projects with varied colors
- Active tasks (mix of priorities, due dates, ages)
- Completed tasks with realistic patterns (time of day, day of week, project focus)
- User stats (karma, goals)

Usage:
    python generate_full_dataset.py --projects 6 --active-tasks 75 --completed-tasks 1500 --months 12
"""

import json
import random
import argparse
from datetime import datetime, timedelta
from typing import List, Dict, Tuple
import math

# Realistic project names and colors
PROJECT_TEMPLATES = [
    {"name": "Work", "color": "blue"},
    {"name": "Personal", "color": "green"},
    {"name": "Health & Fitness", "color": "red"},
    {"name": "Learning", "color": "purple"},
    {"name": "Side Project", "color": "orange"},
    {"name": "Home", "color": "yellow"},
    {"name": "Finance", "color": "charcoal"},
    {"name": "Social", "color": "mint_green"},
]

# Realistic task content templates
TASK_TEMPLATES = {
    "Work": [
        "Review pull request",
        "Weekly team sync",
        "Update project documentation",
        "Fix bug in authentication",
        "Respond to client emails",
        "Quarterly planning meeting",
        "Code review for new feature",
        "Deploy to production",
        "Write unit tests",
        "Refactor legacy code",
    ],
    "Personal": [
        "Buy groceries",
        "Call mom",
        "Schedule dentist appointment",
        "Plan weekend trip",
        "Organize closet",
        "Pay bills",
        "Return package",
        "Birthday gift for friend",
        "Renew car insurance",
        "Update resume",
    ],
    "Health & Fitness": [
        "Morning workout",
        "Meal prep for the week",
        "Schedule physical exam",
        "Go for a run",
        "Yoga class",
        "Track calories",
        "Drink 8 glasses of water",
        "Take vitamins",
        "Stretch before bed",
        "Track weight",
    ],
    "Learning": [
        "Read chapter 3",
        "Watch Python tutorial",
        "Practice Spanish",
        "Complete online course module",
        "Review flashcards",
        "Write blog post",
        "Attend webinar",
        "Research new framework",
        "Take notes on lecture",
        "Work on personal project",
    ],
    "Side Project": [
        "Design landing page",
        "Set up CI/CD pipeline",
        "Write marketing copy",
        "Conduct user interviews",
        "Update dependencies",
        "Fix mobile responsiveness",
        "Optimize database queries",
        "Write blog announcement",
        "Create social media posts",
        "Analytics review",
    ],
    "Home": [
        "Fix leaky faucet",
        "Clean garage",
        "Water plants",
        "Change air filter",
        "Organize garage",
        "Deep clean kitchen",
        "Laundry",
        "Vacuum living room",
        "Take out trash",
        "Mow lawn",
    ],
    "Finance": [
        "Review budget",
        "Update expense tracking",
        "Research investment options",
        "File taxes",
        "Check credit report",
        "Pay credit card bill",
        "Review subscriptions",
        "Update financial goals",
        "Balance checkbook",
        "Meet with financial advisor",
    ],
    "Social": [
        "Plan game night",
        "RSVP to wedding",
        "Catch up with old friend",
        "Organize dinner party",
        "Send thank you cards",
        "Join book club meeting",
        "Coffee with colleague",
        "Respond to invitations",
        "Plan group vacation",
        "Host birthday party",
    ],
}

# Recurring task templates
RECURRING_TEMPLATES = [
    {"content": "Daily standup", "recurrence": "every weekday at 9:30am", "project": "Work"},
    {"content": "Weekly review", "recurrence": "every friday at 5pm", "project": "Work"},
    {"content": "Morning workout", "recurrence": "every monday,wednesday,friday at 7am", "project": "Health & Fitness"},
    {"content": "Meal prep", "recurrence": "every sunday at 2pm", "project": "Health & Fitness"},
    {"content": "Review finances", "recurrence": "every 1st", "project": "Finance"},
    {"content": "Water plants", "recurrence": "every 3 days", "project": "Home"},
    {"content": "Practice Spanish", "recurrence": "every day at 8pm", "project": "Learning"},
    {"content": "Team retrospective", "recurrence": "every other friday at 3pm", "project": "Work"},
]

# Todoist color palette
TODOIST_COLORS = [
    "berry_red", "red", "orange", "yellow", "olive_green", "lime_green",
    "green", "mint_green", "teal", "sky_blue", "light_blue", "blue",
    "grape", "violet", "lavender", "magenta", "salmon", "charcoal",
    "grey", "taupe"
]

# Label templates
LABEL_TEMPLATES = [
    {"name": "urgent", "color": "red"},
    {"name": "waiting", "color": "orange"},
    {"name": "blocked", "color": "charcoal"},
    {"name": "quick-win", "color": "lime_green"},
    {"name": "deep-work", "color": "blue"},
    {"name": "meeting", "color": "grape"},
    {"name": "follow-up", "color": "teal"},
    {"name": "research", "color": "violet"},
    {"name": "review", "color": "sky_blue"},
    {"name": "automation", "color": "mint_green"},
]


def parse_args():
    parser = argparse.ArgumentParser(description="Generate comprehensive test data for Todoist Dashboard")
    parser.add_argument("--projects", type=int, default=6, help="Number of projects to generate")
    parser.add_argument("--active-tasks", type=int, default=75, help="Number of active tasks")
    parser.add_argument("--completed-tasks", type=int, default=1500, help="Number of completed tasks")
    parser.add_argument("--months", type=int, default=12, help="Months of history to generate")
    parser.add_argument("--output", type=str, default="../data/dummy-dataset.json", help="Output file path")
    return parser.parse_args()


def generate_project_id() -> str:
    """Generate unique project ID"""
    return ''.join(random.choices('0123456789', k=10))


def generate_task_id() -> str:
    """Generate unique task ID"""
    return ''.join(random.choices('0123456789', k=10))


def generate_v2_id() -> str:
    """Generate v2 format ID"""
    return ''.join(random.choices('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', k=16))


def generate_label_id() -> str:
    """Generate unique label ID"""
    return ''.join(random.choices('0123456789', k=10))


def generate_labels(num_labels: int = None) -> List[Dict]:
    """Generate label data matching Todoist API structure"""
    if num_labels is None:
        num_labels = len(LABEL_TEMPLATES)

    labels = []
    templates = LABEL_TEMPLATES[:min(num_labels, len(LABEL_TEMPLATES))]

    for i, template in enumerate(templates):
        labels.append({
            "id": generate_label_id(),
            "name": template["name"],
            "color": template["color"],
            "order": i + 1,
            "isFavorite": i < 2  # First 2 labels are favorites
        })

    return labels


def generate_projects(num_projects: int) -> List[Dict]:
    """Generate realistic project data"""
    projects = []
    templates = random.sample(PROJECT_TEMPLATES, min(num_projects, len(PROJECT_TEMPLATES)))

    for i, template in enumerate(templates):
        project_id = generate_project_id()
        projects.append({
            "id": project_id,
            "name": template["name"],
            "color": random.choice(TODOIST_COLORS),
            "commentCount": 0,
            "isShared": False,
            "isFavorite": i < 2,  # First 2 projects are favorites
            "isInboxProject": i == 0,  # First project is inbox
            "isTeamInbox": False,
            "order": i + 1,
            "parentId": None,
            "url": f"https://todoist.com/showProject?id={project_id}",
            "viewStyle": "list"
        })

    return projects


def get_realistic_completion_time(date: datetime, project_name: str) -> datetime:
    """
    Generate realistic completion time based on:
    - Time of day (work hours more common)
    - Day of week (weekdays more common for work)
    - Project type (work tasks during work hours, personal tasks in evening/weekend)
    """
    is_weekday = date.weekday() < 5

    # Different patterns for different project types
    if project_name == "Work":
        # Work tasks: mostly 9am-6pm on weekdays
        if is_weekday:
            hour = random.choices(
                range(24),
                weights=[0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1, 3, 8, 10, 10, 8, 10, 10, 8, 5, 3, 2, 1, 0.5, 0.5, 0.5, 0.5],
                k=1
            )[0]
        else:
            # Occasional weekend work
            hour = random.choices(
                range(24),
                weights=[0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1, 2, 3, 3, 2, 2, 2, 2, 1, 1, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
                k=1
            )[0]
    elif project_name in ["Personal", "Home", "Finance"]:
        # Personal tasks: evenings and weekends
        if is_weekday:
            hour = random.choices(
                range(24),
                weights=[0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1, 2, 3, 2, 1, 1, 1, 1, 1, 1, 2, 3, 5, 8, 10, 8, 5, 2],
                k=1
            )[0]
        else:
            hour = random.choices(
                range(24),
                weights=[0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1, 3, 5, 8, 10, 8, 6, 5, 5, 5, 5, 5, 4, 3, 2, 1, 0.5],
                k=1
            )[0]
    else:
        # Other tasks: distributed throughout day
        hour = random.choices(
            range(24),
            weights=[0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1, 2, 4, 5, 6, 6, 5, 6, 6, 5, 5, 5, 5, 5, 4, 3, 2, 1],
            k=1
        )[0]

    minute = random.choice([0, 15, 30, 45, random.randint(0, 59)])
    return date.replace(hour=hour, minute=minute, second=0, microsecond=0)


def generate_completion_pattern(start_date: datetime, end_date: datetime, num_tasks: int, projects: List[Dict]) -> List[Tuple[datetime, str]]:
    """
    Generate realistic completion pattern with:
    - Variable daily completion rates (productive periods and slow periods)
    - Project focus shifts over time
    - Seasonal variations
    """
    completions = []
    current_date = start_date

    # Create productivity waves (some periods more productive than others)
    total_days = (end_date - start_date).days

    # Generate project focus periods (each project gets focus at different times)
    project_weights = {p["id"]: [] for p in projects}
    for project in projects:
        # Create a wave pattern for each project
        base_weight = 1.0
        for day in range(total_days):
            # Sinusoidal pattern with random phase shift
            phase = random.uniform(0, 2 * math.pi)
            weight = base_weight + 0.5 * math.sin(2 * math.pi * day / 30 + phase)
            project_weights[project["id"]].append(max(0.2, weight))

    # Distribute tasks over time
    for i in range(num_tasks):
        # Determine completion date
        progress = i / num_tasks
        day_offset = int(progress * total_days)
        completion_date = start_date + timedelta(days=day_offset)

        # Add some randomness
        completion_date += timedelta(days=random.randint(-2, 2))
        completion_date = max(start_date, min(completion_date, end_date))

        # Choose project based on current weights
        day_index = (completion_date - start_date).days
        if day_index >= len(project_weights[projects[0]["id"]]):
            day_index = len(project_weights[projects[0]["id"]]) - 1

        weights = [project_weights[p["id"]][day_index] for p in projects]
        project = random.choices(projects, weights=weights, k=1)[0]

        # Add realistic time
        completion_datetime = get_realistic_completion_time(completion_date, project["name"])

        completions.append((completion_datetime, project["id"], project["name"]))

    # Sort by date
    completions.sort(key=lambda x: x[0])

    return completions


def generate_active_tasks(num_tasks: int, projects: List[Dict], labels: List[Dict] = None) -> List[Dict]:
    """Generate active tasks with varied priorities, due dates, ages, and labels"""
    tasks = []
    now = datetime.now()

    # Get label names for assignment
    label_names = [l["name"] for l in labels] if labels else []

    # Distribution of task characteristics
    num_overdue = int(num_tasks * 0.15)  # 15% overdue
    num_due_today = int(num_tasks * 0.10)  # 10% due today
    num_due_this_week = int(num_tasks * 0.25)  # 25% due this week
    num_due_later = int(num_tasks * 0.30)  # 30% due later
    num_no_due_date = num_tasks - (num_overdue + num_due_today + num_due_this_week + num_due_later)

    # Add some recurring tasks
    recurring_tasks = []
    for template in RECURRING_TEMPLATES[:min(8, len(RECURRING_TEMPLATES))]:
        project = next((p for p in projects if p["name"] == template["project"]), projects[0])
        task_id = generate_task_id()
        next_due = now + timedelta(days=random.randint(0, 3))

        recurring_tasks.append({
            "assigneeId": None,
            "assignerId": None,
            "commentCount": 0,
            "content": template["content"],
            "createdAt": (now - timedelta(days=random.randint(30, 365))).strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
            "creatorId": "test_user_123",
            "deadline": next_due.strftime("%Y-%m-%d"),
            "description": "",
            "due": {
                "date": next_due.strftime("%Y-%m-%d"),
                "string": template["recurrence"],
                "lang": "en",
                "isRecurring": True
            },
            "duration": None,
            "id": task_id,
            "isCompleted": False,
            "labels": random.sample(label_names, k=random.randint(0, min(2, len(label_names)))) if label_names else [],
            "order": len(recurring_tasks) + 1,
            "parentId": None,
            "priority": random.randint(1, 4),
            "projectId": project["id"],
            "sectionId": None,
            "url": f"https://app.todoist.com/app/task/{task_id}"
        })

    tasks.extend(recurring_tasks)
    num_tasks -= len(recurring_tasks)

    # Generate one-off tasks
    task_configs = []

    # Overdue tasks
    for _ in range(num_overdue):
        due_date = now - timedelta(days=random.randint(1, 30))
        created_date = due_date - timedelta(days=random.randint(1, 60))
        task_configs.append({
            "due_date": due_date,
            "created_date": created_date,
            "priority": random.choices([1, 2, 3, 4], weights=[0.1, 0.2, 0.3, 0.4], k=1)[0],  # Higher priority for overdue
            "is_stale": (now - created_date).days > 30
        })

    # Due today
    for _ in range(num_due_today):
        created_date = now - timedelta(days=random.randint(1, 30))
        task_configs.append({
            "due_date": now,
            "created_date": created_date,
            "priority": random.choices([1, 2, 3, 4], weights=[0.15, 0.25, 0.35, 0.25], k=1)[0],
            "is_stale": False
        })

    # Due this week
    for _ in range(num_due_this_week):
        due_date = now + timedelta(days=random.randint(1, 7))
        created_date = due_date - timedelta(days=random.randint(1, 45))
        task_configs.append({
            "due_date": due_date,
            "created_date": created_date,
            "priority": random.randint(1, 4),
            "is_stale": (now - created_date).days > 30
        })

    # Due later
    for _ in range(num_due_later):
        due_date = now + timedelta(days=random.randint(8, 90))
        created_date = due_date - timedelta(days=random.randint(1, 60))
        task_configs.append({
            "due_date": due_date,
            "created_date": created_date,
            "priority": random.randint(1, 4),
            "is_stale": False
        })

    # No due date
    for _ in range(num_no_due_date):
        created_date = now - timedelta(days=random.randint(1, 180))
        task_configs.append({
            "due_date": None,
            "created_date": created_date,
            "priority": random.choices([1, 2, 3, 4], weights=[0.4, 0.3, 0.2, 0.1], k=1)[0],  # Lower priority for no due date
            "is_stale": (now - created_date).days > 60
        })

    # Create tasks from configs
    for config in task_configs:
        project = random.choice(projects)
        task_content = random.choice(TASK_TEMPLATES.get(project["name"], TASK_TEMPLATES["Personal"]))
        task_id = generate_task_id()

        # Randomly assign 0-2 labels to ~40% of tasks
        task_labels = []
        if label_names and random.random() < 0.4:
            task_labels = random.sample(label_names, k=random.randint(1, min(2, len(label_names))))

        task = {
            "assigneeId": None,
            "assignerId": None,
            "commentCount": 0,
            "content": task_content,
            "createdAt": config["created_date"].strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
            "creatorId": "test_user_123",
            "description": random.choice(["", "", "", "Additional details about this task"]),  # 25% have description
            "duration": None,
            "id": task_id,
            "isCompleted": False,
            "labels": task_labels,
            "order": len(tasks) + 1,
            "parentId": None,
            "priority": config["priority"],
            "projectId": project["id"],
            "sectionId": None,
            "url": f"https://app.todoist.com/app/task/{task_id}"
        }

        if config["due_date"]:
            task["deadline"] = config["due_date"].strftime("%Y-%m-%d")
            task["due"] = {
                "date": config["due_date"].strftime("%Y-%m-%d"),
                "string": config["due_date"].strftime("%b %d"),
                "lang": "en",
                "isRecurring": False
            }
        else:
            task["deadline"] = None
            task["due"] = None

        tasks.append(task)

    return tasks


def generate_completed_tasks(completions: List[Tuple[datetime, str, str]], projects: List[Dict]) -> List[Dict]:
    """
    Generate completed tasks from completion pattern.

    Returns:
        List of completed task dictionaries matching real Todoist API structure.
    """
    completed_tasks = []

    for completion_datetime, project_id, project_name in completions:
        task_content = random.choice(TASK_TEMPLATES.get(project_name, TASK_TEMPLATES["Personal"]))
        task_id = generate_task_id()

        # Match real Todoist API: item_object is null
        completed_tasks.append({
            "completed_at": completion_datetime.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
            "content": task_content,
            "id": generate_task_id(),
            "item_object": None,  # Real Todoist API returns null
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
        })

    return completed_tasks


def generate_user_stats(num_completed_tasks: int) -> Dict:
    """Generate realistic user stats"""
    # Karma roughly correlates with completed tasks
    base_karma = min(num_completed_tasks * 3, 10000)
    karma = base_karma + random.randint(-500, 500)

    return {
        "karma": karma,
        "karmaTrend": random.choice(["up", "down", "none"]),
        "karmaRising": random.choice([True, False]),
        "dailyGoal": random.choice([5, 7, 10, 12, 15]),
        "weeklyGoal": random.choice([25, 30, 35, 40, 50])
    }


def main():
    args = parse_args()

    print(f"\nGenerating comprehensive test dataset...")
    print(f"   - Projects: {args.projects}")
    print(f"   - Active tasks: {args.active_tasks}")
    print(f"   - Completed tasks: {args.completed_tasks}")
    print(f"   - History: {args.months} months\n")

    # Generate projects
    print("Generating projects...")
    projects = generate_projects(args.projects)

    # Generate labels
    print("Generating labels...")
    labels = generate_labels()
    print(f"   - Generated {len(labels)} labels")

    # Generate completion pattern
    print("Generating realistic completion patterns...")
    end_date = datetime.now()
    start_date = end_date - timedelta(days=args.months * 30)
    completions = generate_completion_pattern(start_date, end_date, args.completed_tasks, projects)

    # Generate tasks
    print("Generating completed tasks...")
    completed_tasks = generate_completed_tasks(completions, projects)

    print("Generating active tasks...")
    active_tasks = generate_active_tasks(args.active_tasks, projects, labels)
    print(f"   - Generated {len(active_tasks)} active tasks")

    # Generate user stats
    print("Generating user stats...")
    user_stats = generate_user_stats(len(completed_tasks))

    # Combine into dataset
    dataset = {
        "allCompletedTasks": completed_tasks,
        "projectData": projects,
        "activeTasks": active_tasks,
        "labels": labels,
        "totalCompletedTasks": len(completed_tasks),
        "hasMoreTasks": False,  # All tasks loaded
        **user_stats
    }

    # Write to file
    print(f"Writing to {args.output}...")
    with open(args.output, 'w') as f:
        json.dump(dataset, f, indent=2)

    print(f"\nSuccessfully generated test dataset!")
    print(f"\nSummary:")
    print(f"   - Projects: {len(projects)}")
    print(f"   - Labels: {len(labels)}")
    print(f"   - Active tasks: {len(active_tasks)}")
    print(f"   - Completed tasks: {len(completed_tasks)}")
    print(f"   - Date range: {start_date.date()} to {end_date.date()}")
    print(f"   - Karma: {user_stats['karma']}")
    print(f"   - Daily goal: {user_stats['dailyGoal']}")
    print(f"   - Weekly goal: {user_stats['weeklyGoal']}")
    print(f"\nReady to use! Toggle USE_DUMMY_DATA in .env.local\n")


if __name__ == "__main__":
    main()
