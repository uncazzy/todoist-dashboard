from datetime import datetime, timedelta
import json
import random
import argparse
from typing import List, Dict
import os
from patterns.weekly import WeeklyPattern
from patterns.monthly import MonthlyPattern
from patterns.daily import DailyPattern
from patterns.yearly import YearlyPattern
from patterns.constants import (
    FREQUENCIES,
    WEEKDAYS,
    MONTHS,
    INTERVALS
)
from calendar import monthrange

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
    """Format recurrence string based on command line arguments"""
    recurrence = ""
    
    # Handle frequency
    if args.frequency == "workday":
        recurrence = "every workday"
    elif args.frequency == "daily":
        if args.interval > 1:
            recurrence = f"every {args.interval} days"
        else:
            recurrence = "every day"
    else:
        recurrence = f"every"
    
    # Add interval if specified
    if args.interval > 1 and args.frequency != "daily":
        if args.frequency == "weekly" and args.interval == 2:
            recurrence = "every other"  # Special case for "every other"
        else:
            recurrence += f" {args.interval}"
    
    # Add frequency-specific components
    if args.frequency == "weekly":
        # Special case for weekends
        if args.weekdays and args.weekdays.lower() in ["saturday,sunday", "sunday,saturday"]:
            recurrence = "every weekend"
        # Add weekdays for other weekly patterns
        elif args.weekdays:
            weekdays = [day.strip().lower() for day in args.weekdays.split(",")]
            recurrence += f" {','.join(weekdays)}"
    elif args.frequency == "monthly":
        if args.days:
            # Handle specific days of month
            if args.days.lower() == "last":
                recurrence += " last day"
            else:
                days = [day.strip() for day in args.days.split(",")]
                recurrence += f" {','.join(days)}"
        elif args.week_number and args.weekdays:
            # Handle patterns like "1st monday"
            recurrence += f" {args.week_number} {args.weekdays}"
    elif args.frequency == "yearly" and args.month:
        recurrence += f" {args.month}"
        if args.days:
            recurrence += f" {args.days}"
    
    # Add time if specified
    if args.time:
        recurrence += f" at {args.time}"
    
    # Add strict scheduling if specified
    if args.strict:
        recurrence += "!"
    
    return recurrence

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
    
    # Map weekday names to numbers (0 = Sunday, 6 = Saturday)
    weekday_map = {
        "monday": 1, "mon": 1,
        "tuesday": 2, "tue": 2,
        "wednesday": 3, "wed": 3,
        "thursday": 4, "thu": 4,
        "friday": 5, "fri": 5,
        "saturday": 6, "sat": 6,
        "sunday": 0, "sun": 0,
        "weekend": 6  # Map weekend to Saturday as the starting day
    }
    
    # Handle different frequencies
    if "day" in parts[0]:
        if "work" in parts[0]:  # workday
            current += timedelta(days=1)
            while current.weekday() >= 5:  # Skip weekends
                current += timedelta(days=1)
        else:  # regular day
            # For daily patterns, we need to find the next occurrence that matches the interval pattern
            days_since_start = (current.date() - current.replace(year=2024, month=1, day=1).date()).days
            days_until_next = interval - (days_since_start % interval)
            if days_until_next == interval:
                days_until_next = 0
            current += timedelta(days=days_until_next + 1)
    
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
        current_weekday = current.weekday()
        if current_weekday == 6:  # Convert Sunday from 6 to 0
            current_weekday = 0
        days_ahead = target_weekday - current_weekday
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
            current_weekday = current.weekday()
            if current_weekday == 6:  # Convert Sunday from 6 to 0
                current_weekday = 0
            days_ahead = target_weekday - current_weekday
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
        month_map = {month.lower(): i+1 for i, month in enumerate(MONTHS[:12])}  # Only use full month names
        # Also add abbreviated month names
        month_map.update({month.lower()[:3]: i+1 for i, month in enumerate(MONTHS[:12])})
        
        month_num = None
        days = []
        
        # Find the month
        for part in parts:
            if part in month_map:
                month_num = month_map[part]
                break
        
        # Find the days
        for part in parts:
            part = part.strip(',')
            if part.isdigit() or part.endswith(('st', 'nd', 'rd', 'th')):
                days.append(int(''.join(filter(str.isdigit, part))))
        
        if month_num:
            # If no days specified, use current day
            if not days:
                days = [current.day]
            
            # Generate dates for each year
            current_year = current.year
            while current_year <= current.year + interval:
                for day in days:
                    # Create date for this year
                    try:
                        task_date = datetime(year=current_year, month=month_num, day=day)
                        if current <= task_date:
                            current = task_date
                    except ValueError:
                        # Skip invalid dates (e.g., February 30)
                        pass
                current_year += 1
                
                # Sort dates in chronological order
                # dates.sort()
                
                # Then randomly select based on completion rate
                # if completion_rate < 1.0:
                #     selected_count = max(1, int(len(dates) * completion_rate))  # At least 1 completion
                #     dates = random.sample(dates, selected_count)
                #     dates.sort()  # Keep dates in order
                
                # # Format dates as strings
                # return [d.strftime("%Y-%m-%dT%H:%M:00-05:00") for d in dates]
    
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

def generate_weekly_dates(start_date: datetime, end_date: datetime, target_weekday: int, interval_weeks: int) -> List[datetime]:
    """Generate dates for weekly patterns"""
    dates = []
    
    # Start from the beginning of the week of start_date
    current = start_date - timedelta(days=start_date.weekday())
    
    # Move to the first target weekday
    while current.weekday() != target_weekday:
        current += timedelta(days=1)
    
    # If we've moved past the start date, go back by interval weeks
    if current < start_date:
        while current <= start_date:
            current += timedelta(weeks=interval_weeks)
        current -= timedelta(weeks=interval_weeks)
    
    # Generate dates
    while current <= end_date:
        if current >= start_date:
            dates.append(current)
        current += timedelta(weeks=interval_weeks)
    
    return dates

def generate_completion_dates(
    start_date: datetime,
    end_date: datetime,
    recurrence: str,
    completion_rate: float = 1.0
) -> List[str]:
    """Generate completion dates based on recurrence pattern"""
    dates = []
    parts = recurrence.lower().split()
    
    # Handle daily patterns
    if "every" in parts and (
        "day" in parts or 
        any(part.isdigit() and "day" in parts[parts.index(part)+1:] for part in parts)
    ):
        interval = 1
        for i, part in enumerate(parts):
            if part.isdigit():
                interval = int(part)
                break
        
        dates = DailyPattern.generate_daily(start_date, end_date, interval)
    
    # Handle monthly patterns
    elif "every" in parts and (
        any(part.endswith(("st", "nd", "rd", "th")) for part in parts) or
        "last" in parts
    ):
        # Extract days from the recurrence string
        days = []
        for part in parts:
            if part == "day":  # Skip the word "day"
                continue
            if part == "last":
                days.append("last")
            elif any(suffix in part for suffix in ["st", "nd", "rd", "th"]):
                days.append(part)
        
        # Split days if they contain commas
        all_days = []
        for day in days:
            if ',' in day:
                all_days.extend(d.strip() for d in day.split(','))
            else:
                all_days.append(day)
        
        # Generate dates for each day
        for day in all_days:
            dates.extend(MonthlyPattern.generate_monthly_by_date(start_date, end_date, day))
    
    # Handle yearly patterns
    elif "every" in parts and any(month in parts for month in MONTHS):
        month = next(month for month in parts if month in MONTHS)
        day = next((part for part in parts if any(suffix in part for suffix in ["st", "nd", "rd", "th"])), None)
        if day:
            interval = 1
            for i, part in enumerate(parts):
                if part.isdigit():
                    interval = int(part)
                    break
            dates = YearlyPattern.generate_yearly_by_date(start_date, end_date, month, day, interval)
    
    # Handle weekend pattern
    elif recurrence.lower() == "every weekend":
        # Generate dates for Saturday and Sunday
        dates.extend(WeeklyPattern.generate_every_weekday(start_date, end_date, "saturday"))
        dates.extend(WeeklyPattern.generate_every_weekday(start_date, end_date, "sunday"))
    
    # Handle weekly patterns
    elif "every" in parts and any(day in parts for day in WEEKDAYS):
        weekday = next(day for day in parts if day in WEEKDAYS)
        dates = WeeklyPattern.generate_every_weekday(start_date, end_date, weekday)
    
    # Apply completion rate if needed
    if completion_rate < 1.0:
        dates = random.sample(dates, int(len(dates) * completion_rate))
        dates.sort()  # Keep dates in chronological order
    
    # Convert dates to strings while preserving timezone
    return [d.strftime("%Y-%m-%dT%H:%M:00%z") for d in dates]

def generate_active_task(
    task_id: str,
    content: str,
    project_id: str,
    recurrence: str,
    due_date: str
) -> Dict:
    """Generate an active task in Todoist API format"""
    return {
        "assigneeId": None,
        "assignerId": None,
        "commentCount": 0,
        "content": content,
        "createdAt": datetime.now().strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
        "creatorId": "19621174",
        "deadline": due_date,  # Use the full due date
        "description": "",
        "due": {
            "date": due_date,  # Use the full due date
            "string": recurrence,  # Keep original case
            "lang": "en",
            "isRecurring": True
        },
        "duration": None,
        "id": task_id,
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
    """Generate a completed task in Todoist API format"""
    return {
        "completed_at": completed_at,
        "content": content,
        "id": str(random.randint(1000000000, 9999999999)),
        "item_object": None,
        "meta_data": None,
        "note_count": 0,
        "notes": [],
        "project_id": project_id,
        "section_id": None,
        "task_id": task_id,
        "user_id": "19621174",
        "v2_project_id": ''.join(random.choices('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', k=16)),
        "v2_section_id": None,
        "v2_task_id": ''.join(random.choices('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', k=16))
    }

def generate_project(
    project_id: str,
    name: str
) -> Dict:
    """Generate a project in Todoist API format"""
    return {
        "id": project_id,
        "name": name,
        "color": "blue",
        "commentCount": 0,
        "isShared": False,
        "isFavorite": False,
        "isInboxProject": False,
        "isTeamInbox": False,
        "order": 1,
        "parentId": None,
        "url": f"https://todoist.com/showProject?id={project_id}",
        "viewStyle": "list"
    }

def write_test_data(
    active_tasks: List[Dict],
    completed_tasks: List[Dict],
    projects: List[Dict]
) -> None:
    """Write test data to JSON files"""
    # Write active tasks
    with open('../data/test-active-tasks.json', 'w') as f:
        json.dump({"activeTasks": active_tasks}, f, indent=2)
    
    # Write completed tasks
    with open('../data/test-completed-tasks.json', 'w') as f:
        json.dump({"allCompletedTasks": completed_tasks}, f, indent=2)
    
    # Write projects
    with open('../data/test-project-data.json', 'w') as f:
        json.dump({"projectData": projects}, f, indent=2)

def main():
    """Generate test data for recurring tasks"""
    args = parse_args()
    
    # Format recurrence string
    recurrence = format_recurrence_string(args)
    print("\nGenerated test data:")
    print(f"- Recurrence: {recurrence}")
    print(f"- Completion rate: {args.completion_rate * 100}%")
    
    # Get current time
    now = datetime.strptime("2024-12-15T09:28:13-05:00", "%Y-%m-%dT%H:%M:%S%z")
    
    # Generate dates
    start_date = now - timedelta(days=args.history_days)
    completion_dates = generate_completion_dates(
        start_date=start_date,
        end_date=now,
        recurrence=recurrence,
        completion_rate=args.completion_rate
    )
    
    # Convert string dates back to datetime objects
    completion_dates = [datetime.strptime(date, "%Y-%m-%dT%H:%M:00%z") for date in completion_dates]
    completion_dates.sort()
    
    print(f"- {len(completion_dates)} completed tasks\n")
    print("Sample completion dates (first 10):")
    for date in completion_dates[:10]:
        print(f"- {date.strftime('%Y-%m-%d (%A)')}")
    
    # Generate test data
    project_id = "test_project_1"
    task_id = "test_task_1"
    
    # Calculate next due date (tomorrow)
    next_due_date = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Always generate active task for recurring tasks
    active_tasks = [
        generate_active_task(
            task_id=task_id,
            content="Test recurring task",
            project_id=project_id,
            recurrence=recurrence,
            due_date=next_due_date.strftime("%Y-%m-%dT%H:%M:00%z")
        )
    ]
    
    # Generate completed tasks
    completed_tasks = [
        generate_completed_task(
            task_id=task_id,
            content="Test recurring task",
            project_id=project_id,
            completed_at=date.strftime("%Y-%m-%dT%H:%M:00%z")
        )
        for date in completion_dates
    ]
    
    # Generate project
    projects = [
        generate_project(
            project_id=project_id,
            name="Test Project"
        )
    ]
    
    # Write test data
    write_test_data(active_tasks, completed_tasks, projects)

if __name__ == "__main__":
    main()
