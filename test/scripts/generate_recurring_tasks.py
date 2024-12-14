from datetime import datetime, timedelta
import json
import random
import argparse
from typing import List, Dict, Optional
import os

# Base frequencies
FREQUENCIES = [
    "daily",      # every day
    "workday",    # every workday (Mon-Fri)
    "weekend",    # every weekend (Sat-Sun)
    "weekly",     # every week
    "monthly",    # every month
    "yearly"      # every year
]

# Time modifiers
TIME_FORMATS = [
    None,         # no specific time
    "09:00",      # HH:MM format
    "09:15",
    "10:30",
    "14:00",      # 2pm
    "22:30",      # 10:30pm
    "02:00pm",    # Alternative format
    "10:00am"     # Alternative format
]

# Day specifiers for monthly
MONTH_DAYS = [
    "1",          # 1st
    "15",         # 15th
    "last",       # last day
    "1,15,30",    # multiple days
    "2,15,27",    # multiple days
    "1st",        # Alternative format
    "15th",       # Alternative format
    "last day"    # Full format
]

# Week day specifiers
WEEKDAYS = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
    "mon",        # Short forms
    "tue",
    "wed",
    "thu",
    "fri",
    "sat",
    "sun"
]

# Week numbers for monthly patterns
WEEK_NUMBERS = [
    "1st",
    "2nd",
    "3rd",
    "4th",
    "last",
    "first",      # Alternative format
    "second",
    "third",
    "fourth"
]

# Month names for yearly patterns
MONTHS = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
    "jan",        # Short forms
    "feb",
    "mar",
    "apr",
    "may",
    "jun",
    "jul",
    "aug",
    "sep",
    "oct",
    "nov",
    "dec"
]

# Interval modifiers
INTERVALS = [
    1,      # every (default)
    2,      # every other/2nd
    3,      # every 3rd
    6,      # every 6th
    12,     # every 12th
    24      # every 24 (for hours)
]

def parse_args():
    parser = argparse.ArgumentParser(description="Generate test data for recurring tasks")
    
    # Base frequency
    parser.add_argument("--frequency", choices=FREQUENCIES, default="weekly",
                      help="Base frequency of the recurring task")
    
    # Modifiers
    parser.add_argument("--time", type=str, default=None,
                      help="Specific time for the task (HH:MM format or HH:MMam/pm)")
    parser.add_argument("--days", type=str, default=None,
                      help="Specific days for monthly tasks (e.g., '1,15,30' or '1st,15th')")
    parser.add_argument("--weekdays", type=str, default="monday",
                      help="Specific weekdays (e.g., 'mon,wed,fri' or 'monday,wednesday,friday')")
    parser.add_argument("--week-number", type=str, default=None,
                      help="Week number for monthly patterns (e.g., '1st', 'first', 'last')")
    parser.add_argument("--month", type=str, default=None,
                      help="Specific month for yearly patterns (e.g., 'january' or 'jan')")
    parser.add_argument("--interval", type=int, choices=INTERVALS, default=1,
                      help="Interval between occurrences (e.g., 2 for 'every other')")
    parser.add_argument("--interval-unit", choices=['hour', 'day', 'week', 'month', 'year'], default=None,
                      help="Unit for interval (e.g., 'hour' for 'every 12 hours')")
    parser.add_argument("--strict", action="store_true",
                      help="Use strict scheduling (equivalent to 'every!')")
    parser.add_argument("--workday-ordinal", type=str, default=None,
                      help="Ordinal for workday (e.g., '1st', 'last', '3rd')")
    
    # Task generation options
    parser.add_argument("--completion-rate", type=float, default=1.0,
                      help="Rate of completion (0.0 to 1.0)")
    parser.add_argument("--history-days", type=int, default=180,
                      help="Number of days of history to generate")
    
    args = parser.parse_args()
    
    # Validate combinations
    if args.frequency == "yearly" and not args.month:
        parser.error("Yearly frequency requires --month")
    if args.frequency == "monthly" and not any([args.days, args.week_number]):
        parser.error("Monthly frequency requires either --days or --week-number")
    
    return args

def format_recurrence_string(args) -> str:
    """Generate Todoist-compatible recurrence string"""
    parts = []
    
    # Start with interval and handle special cases
    if args.interval_unit:
        parts.append(f"every {args.interval} {args.interval_unit}s" if args.interval > 1 else f"every {args.interval_unit}")
    elif args.interval > 1:
        parts.append(f"every {args.interval}")
    else:
        parts.append("every")
    
    # Add frequency-specific parts
    if args.frequency == "daily":
        if not args.interval_unit:
            if args.interval > 1:
                parts.append("days")
            else:
                parts.append("day")
    elif args.frequency == "workday":
        if args.workday_ordinal:
            parts.append(f"{args.workday_ordinal} workday")
        else:
            parts.append("workday")
    elif args.frequency == "weekend":
        parts.append("weekend")  # Use 'weekend' directly for better compatibility
    elif args.frequency == "weekly":
        if args.weekdays:
            # Handle both full and abbreviated forms
            weekdays = args.weekdays.lower().split(',')
            formatted_weekdays = []
            for day in weekdays:
                day = day.strip()
                if len(day) <= 3:  # It's abbreviated
                    formatted_weekdays.append(day.capitalize())
                else:
                    formatted_weekdays.append(day.capitalize())
            parts.append(", ".join(formatted_weekdays))
        else:
            parts.append(WEEKDAYS[random.randint(0, 6)].capitalize())
    elif args.frequency == "monthly":
        if args.days:
            # Handle both numeric and ordinal forms
            days = args.days.split(',')
            formatted_days = []
            for day in days:
                day = day.strip()
                if day.endswith('th') or day.endswith('st') or day.endswith('rd') or day.endswith('nd'):
                    formatted_days.append(day)
                else:
                    formatted_days.append(day)
            parts.append(", ".join(formatted_days))
        elif args.week_number:
            weekday = args.weekdays or WEEKDAYS[random.randint(0, 6)]
            # Handle both forms (e.g., "1st" and "first")
            week_num = args.week_number
            parts.append(f"{week_num} {weekday.capitalize()}")
    elif args.frequency == "yearly":
        month = args.month.capitalize()
        if args.days:
            # Handle both numeric and ordinal forms
            days = args.days.split(',')
            formatted_days = []
            for day in days:
                day = day.strip()
                if day.endswith('th') or day.endswith('st') or day.endswith('rd') or day.endswith('nd'):
                    formatted_days.append(day)
                else:
                    formatted_days.append(day)
            parts.append(f"{month} {', '.join(formatted_days)}")
        else:
            parts.append(f"{month} {datetime.now().day}")
    
    # Add time if specified
    if args.time:
        parts.append(f"at {args.time}")
    
    # Add strict marker if needed
    if args.strict:
        parts[0] = f"{parts[0]}!"
    
    return " ".join(parts)

def get_next_occurrence(current: datetime, recurrence: str) -> datetime:
    """Calculate next occurrence based on recurrence pattern"""
    parts = recurrence.lower().split()
    
    # Handle intervals
    interval = 1
    if parts[1].isdigit():
        interval = int(parts[1])
        parts = parts[2:]  # Skip the interval number
    else:
        parts = parts[1:]  # Skip "every"
    
    # Handle strict scheduling (every!)
    if parts[0].endswith('!'):
        parts[0] = parts[0][:-1]  # Remove the !
    
    # Map weekday names to numbers (0 = Monday, 6 = Sunday)
    weekday_map = {
        "monday": 0, "mon": 0,
        "tuesday": 1, "tue": 1,
        "wednesday": 2, "wed": 2,
        "thursday": 3, "thu": 3,
        "friday": 4, "fri": 4,
        "saturday": 5, "sat": 5,
        "sunday": 6, "sun": 6,
        "weekend": 5  # Map weekend to Saturday as the starting day
    }
    
    # Handle different frequencies
    if "day" in parts[0]:
        if "work" in parts[0]:  # workday
            current += timedelta(days=1)
            while current.weekday() >= 5:  # Skip weekends
                current += timedelta(days=1)
        else:  # regular day
            current += timedelta(days=interval)
    
    elif parts[0] == "weekend":  # Handle weekend pattern
        current += timedelta(days=1)
        while current.weekday() < 5:  # Skip weekdays until we hit Saturday
            current += timedelta(days=1)
        # If interval > 1, add remaining weeks
        if interval > 1:
            current += timedelta(weeks=interval - 1)
    
    elif parts[0] in weekday_map:  # Direct weekday reference (e.g., "every monday")
        target_weekday = weekday_map[parts[0]]
        # Calculate days until next occurrence
        days_ahead = target_weekday - current.weekday()
        if days_ahead <= 0:  # Target day already passed this week
            days_ahead += 7
        current += timedelta(days=days_ahead)
        
        # If interval > 1, add remaining weeks
        if interval > 1:
            current += timedelta(weeks=interval - 1)
    
    elif "week" in parts[0]:  # Weekly pattern with specified day
        # Look for weekday in remaining parts
        target_weekday = None
        for part in parts[1:]:
            part = part.lower().strip(',')
            if part in weekday_map:
                target_weekday = weekday_map[part]
                break
        
        if target_weekday is None:
            # If no specific day mentioned, use current weekday
            target_weekday = current.weekday()
            current += timedelta(weeks=interval)
        else:
            # Calculate days until next occurrence
            days_ahead = target_weekday - current.weekday()
            if days_ahead <= 0:  # Target day already passed this week
                days_ahead += 7
            current += timedelta(days=days_ahead)
            
            # If interval > 1, add remaining weeks
            if interval > 1:
                current += timedelta(weeks=interval - 1)
    
    elif "month" in parts[0]:
        # Get the current month's last day
        if current.month == 12:
            next_month = current.replace(year=current.year + 1, month=1)
        else:
            next_month = current.replace(month=current.month + 1)
        
        last_day = (next_month - timedelta(days=1)).day
        
        # Handle specific days of month
        days = []
        for part in parts[1:]:
            part = part.strip(',')
            if part.isdigit() or part.endswith(('st', 'nd', 'rd', 'th')):
                days.append(int(''.join(filter(str.isdigit, part))))
        
        if days:
            # Find the next occurrence from the list of days
            next_day = None
            for day in sorted(days):
                if current.day < day:
                    next_day = day
                    break
            
            if next_day is None:
                # All days have passed this month, move to next month
                if current.month == 12:
                    current = current.replace(year=current.year + 1, month=1, day=min(days[0], last_day))
                else:
                    current = current.replace(month=current.month + 1, day=min(days[0], last_day))
            else:
                current = current.replace(day=min(next_day, last_day))
        else:
            # Simple monthly
            for _ in range(interval):
                if current.month == 12:
                    current = current.replace(year=current.year + 1, month=1)
                else:
                    current = current.replace(month=current.month + 1)
    
    elif "year" in parts[0] or any(month.lower() in parts for month in MONTHS):
        # Get month number if specified
        month_num = None
        for part in parts:
            part = part.lower()
            for i, month in enumerate(MONTHS[:12]):  # Only use full month names
                if month.lower() == part:
                    month_num = i + 1
                    break
            if month_num:
                break
        
        # Get day if specified
        day = None
        for part in parts:
            part = part.strip(',')
            if part.isdigit() or part.endswith(('st', 'nd', 'rd', 'th')):
                day = int(''.join(filter(str.isdigit, part)))
                break
        
        # If no day specified, use current day
        if not day:
            day = current.day
        
        # If no month specified, use current month
        if not month_num:
            month_num = current.month
        
        # Check if we need to move to next year
        if current.month > month_num or (current.month == month_num and current.day >= day):
            current = current.replace(year=current.year + interval)
        
        # Set the month and day
        try:
            current = current.replace(month=month_num, day=day)
        except ValueError:
            # Handle invalid dates (e.g., February 30)
            if month_num == 2:  # February
                current = current.replace(month=month_num, day=28)  # Use last day of February
            else:
                # Get the last day of the month
                next_month = current.replace(month=month_num + 1 if month_num < 12 else 1, 
                                          year=current.year + (1 if month_num == 12 else 0))
                last_day = (next_month - timedelta(days=1)).day
                current = current.replace(month=month_num, day=last_day)
    
    # Handle time if specified
    if "at" in recurrence.lower():
        time_parts = recurrence.lower().split("at")[1].strip().split()
        time_str = time_parts[0]
        
        # Convert 12-hour format to 24-hour
        if "pm" in time_str or "am" in time_str:
            time_str = time_str.replace("pm", "").replace("am", "")
            if ":" in time_str:
                hour, minute = map(int, time_str.split(":"))
            else:
                hour, minute = int(time_str), 0
            
            if "pm" in recurrence.lower() and hour != 12:
                hour += 12
            elif "am" in recurrence.lower() and hour == 12:
                hour = 0
        else:
            # 24-hour format
            if ":" in time_str:
                hour, minute = map(int, time_str.split(":"))
            else:
                hour, minute = int(time_str), 0
        
        current = current.replace(hour=hour, minute=minute)
    
    return current

def generate_completion_dates(
    start_date: datetime,
    end_date: datetime,
    recurrence: str,
    completion_rate: float = 1.0
) -> List[str]:
    """Generate completion dates based on recurrence pattern"""
    dates = []
    current = start_date
    
    # Check if it's a yearly task
    if any(month.lower() in recurrence.lower() for month in MONTHS):
        # Extract month and day from recurrence string
        month_map = {month.lower(): i+1 for i, month in enumerate(MONTHS[:12])}  # Only use full month names
        # Also add abbreviated month names
        month_map.update({month.lower()[:3]: i+1 for i, month in enumerate(MONTHS[:12])})
        
        month_num = None
        days = []
        
        # Find the month
        for part in recurrence.lower().split():
            if part in month_map:
                month_num = month_map[part]
                break
        
        # Find the days
        for part in recurrence.lower().split():
            part = part.strip(',')
            if part.isdigit() or part.endswith(('st', 'nd', 'rd', 'th')):
                days.append(int(''.join(filter(str.isdigit, part))))
        
        if month_num:
            # If no days specified, use current day
            if not days:
                days = [current.day]
            
            # Generate dates for each year
            current_year = current.year
            while current_year <= end_date.year:
                for day in days:
                    # Create date for this year
                    try:
                        task_date = datetime(year=current_year, month=month_num, day=day)
                        if start_date <= task_date <= end_date:
                            dates.append(task_date)
                    except ValueError:
                        # Skip invalid dates (e.g., February 30)
                        pass
                current_year += 1
            
            # Sort dates in chronological order
            dates.sort()
            
            # Then randomly select based on completion rate
            if completion_rate < 1.0:
                selected_count = max(1, int(len(dates) * completion_rate))  # At least 1 completion
                dates = random.sample(dates, selected_count)
                dates.sort()  # Keep dates in order
            
            # Format dates as strings
            return [d.strftime("%Y-%m-%dT%H:%M:00-05:00") for d in dates]
    
    # Check if it's a monthly task with specific days
    elif 'month' in recurrence.lower() or any(part.strip(',').isdigit() or part.strip(',').endswith(('st', 'nd', 'rd', 'th')) for part in recurrence.lower().split()):
        # Extract days from recurrence string
        days = []
        for part in recurrence.lower().split():
            part = part.strip(',')
            if part.isdigit() or part.endswith(('st', 'nd', 'rd', 'th')):
                days.append(int(''.join(filter(str.isdigit, part))))
        
        if days:
            # Generate dates for each specified day
            while current <= end_date:
                # Get the last day of the current month
                if current.month == 12:
                    next_month = current.replace(year=current.year + 1, month=1)
                else:
                    next_month = current.replace(month=current.month + 1)
                last_day = (next_month - timedelta(days=1)).day
                
                # Add each valid day for this month
                for day in days:
                    if day <= last_day:
                        task_date = current.replace(day=day)
                        if start_date <= task_date <= end_date:
                            dates.append(task_date)
                
                # Move to the first of next month
                if current.month == 12:
                    current = current.replace(year=current.year + 1, month=1, day=1)
                else:
                    current = current.replace(month=current.month + 1, day=1)
            
            # Sort dates in chronological order
            dates.sort()
            
            # Then randomly select based on completion rate
            if completion_rate < 1.0:
                selected_count = max(1, int(len(dates) * completion_rate))  # At least 1 completion
                dates = random.sample(dates, selected_count)
                dates.sort()  # Keep dates in order
            
            # Format dates as strings
            return [d.strftime("%Y-%m-%dT%H:%M:00-05:00") for d in dates]
    
    # Check if it's a daily task
    elif 'day' in recurrence.lower() and not any(day in recurrence.lower() for day in ['workday', 'weekend']):
        # Generate dates for every day
        while current <= end_date:
            dates.append(current)
            current += timedelta(days=1)
    else:
        # Extract weekday from recurrence string
        weekday_map = {
            'monday': 0, 'tuesday': 1, 'wednesday': 2, 'thursday': 3,
            'friday': 4, 'saturday': 5, 'sunday': 6,
            'mon': 0, 'tue': 1, 'wed': 2, 'thu': 3, 'fri': 4, 'sat': 5, 'sun': 6,
            'weekend': [5, 6],  # Weekend maps to both Saturday and Sunday
            'day': None  # Special case for daily tasks
        }
        
        # Find the weekday in the recurrence string
        target_weekdays = None
        for pattern, weekday_nums in weekday_map.items():
            if pattern in recurrence.lower():
                target_weekdays = weekday_nums if isinstance(weekday_nums, list) else [weekday_nums]
                break
        
        if target_weekdays is None and not any(part.strip(',').isdigit() or part.strip(',').endswith(('st', 'nd', 'rd', 'th')) for part in recurrence.lower().split()):
            print(f"Warning: No weekday found in recurrence string: {recurrence}")
            return []
        
        # First, generate all possible dates
        while current <= end_date:
            # Add dates that match any of the target weekdays
            if target_weekdays is None or current.weekday() in target_weekdays:
                dates.append(current)
            current += timedelta(days=1)
    
    # Then randomly select based on completion rate
    if completion_rate < 1.0:
        selected_count = max(1, int(len(dates) * completion_rate))  # At least 1 completion
        dates = random.sample(dates, selected_count)
        dates.sort()  # Keep dates in order
    
    # Format dates as strings
    return [d.strftime("%Y-%m-%dT%H:%M:00-05:00") for d in dates]

def generate_active_task(
    task_id: str,
    content: str,
    project_id: str,
    recurrence: str,
    due_date: str
) -> Dict:
    # Parse the due_date to get just the date part
    date_only = due_date.split('T')[0]
    
    return {
        "assigneeId": None,
        "assignerId": None,
        "commentCount": 0,
        "content": content,
        "createdAt": datetime.now().strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
        "creatorId": "19621174",
        "deadline": date_only,  # Just the date part
        "description": "",
        "due": {
            "date": date_only,  # Just the date part
            "string": recurrence,  # Keep original case
            "lang": "en",
            "isRecurring": True
        },
        "duration": None,
        "id": task_id,  # Use the same ID
        "isCompleted": False,
        "labels": [],
        "order": random.randint(1, 10),
        "parentId": None,
        "priority": random.randint(1, 4),
        "projectId": project_id,
        "sectionId": None,
        "url": f"https://app.todoist.com/app/task/{task_id}"
    }

def generate_completed_task(
    task_id: str,
    content: str,
    project_id: str,
    completed_at: str
) -> Dict:
    return {
        "completed_at": completed_at,
        "content": content,
        "id": str(random.randint(1000000000, 9999999999)),  # 10-digit numeric ID
        "item_object": None,
        "meta_data": None,
        "note_count": 0,
        "notes": [],
        "project_id": project_id,
        "section_id": None,
        "task_id": task_id,
        "user_id": "19621174",
        "v2_project_id": ''.join(random.choices('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', k=16)),
        "v2_section_id": None,
        "v2_task_id": ''.join(random.choices('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', k=16))
    }

def generate_project(
    project_id: str,
    name: str
) -> Dict:
    """Generate a project"""
    return {
        "id": project_id,
        "name": name,
        "color": "blue",
        "parent_id": None,
        "order": 1,
        "commentCount": 0,
        "isShared": False,
        "isFavorite": False,
        "isInboxProject": False,
        "isTeamInbox": False,
        "viewStyle": "list",
        "sync_id": None,
        "url": f"https://todoist.com/app/project/{project_id}",
        "is_deleted": 0,
        "is_archived": 0,
        "parentId": None,
    }

def write_test_data(
    active_tasks: List[Dict],
    completed_tasks: List[Dict],
    projects: List[Dict]
) -> None:
    """Write test data to JSON files"""
    # Create test data directory if it doesn't exist
    os.makedirs("test/data", exist_ok=True)

    # Write active tasks
    with open("test/data/test-active-tasks.json", "w") as f:
        json.dump({"activeTasks": active_tasks}, f, indent=2)

    # Write completed tasks
    with open("test/data/test-completed-tasks.json", "w") as f:
        json.dump({"allCompletedTasks": completed_tasks}, f, indent=2)

    # Write project data
    with open("test/data/test-project-data.json", "w") as f:
        json.dump({"projectData": projects}, f, indent=2)

def main():
    """Generate test data for recurring tasks"""
    args = parse_args()
    
    # Generate recurrence string based on arguments
    recurrence = format_recurrence_string(args)
    
    # Calculate start and end dates
    end_date = datetime.now()
    if args.frequency == "yearly":
        start_date = end_date - timedelta(days=365 * 3)  # 3 years of history for yearly tasks
    else:
        start_date = end_date - timedelta(days=180)  # 6 months ago for other frequencies
    
    # Generate completion dates with the specified completion rate
    completion_dates = generate_completion_dates(
        start_date=start_date,
        end_date=end_date,
        recurrence=recurrence,
        completion_rate=args.completion_rate  # Use the command line argument
    )
    
    # Generate a consistent task ID
    task_id = str(random.randint(1000000000, 9999999999))
    
    # Create one active task
    active_task = generate_active_task(
        task_id=task_id,  # Use the same task ID
        content="Weekly Task",
        project_id="2301927646",  # Use real project ID
        recurrence=recurrence,
        due_date=end_date.strftime("%Y-%m-%dT%H:%M:00-05:00")
    )
    
    # Create completed tasks
    completed_tasks = []
    for i, completed_at in enumerate(completion_dates):
        completed_task = generate_completed_task(
            task_id=task_id,  # Use the same task ID for all completions
            content="Weekly Task",
            project_id="2301927646",  # Use real project ID
            completed_at=completed_at
        )
        completed_tasks.append(completed_task)
    
    # Create project data
    project = generate_project(
        project_id="2301927646",  # Use real project ID
        name="Test Project"
    )
    
    # Write test data to files
    write_test_data(
        active_tasks=[active_task],
        completed_tasks=completed_tasks,
        projects=[project]
    )
    
    print("\nGenerated test data:")
    print(f"- Recurrence: {recurrence}")
    print(f"- Completion rate: {args.completion_rate * 100}%")
    print(f"- {len(completion_dates)} completed tasks\n")
    print("Files written to", os.path.abspath("test/data/"), "\n")

if __name__ == "__main__":
    main()
