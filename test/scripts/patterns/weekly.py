from datetime import datetime, timedelta
from typing import List, Optional

class WeeklyPattern:
    WEEKDAY_MAP = {
        'monday': 0, 'tuesday': 1, 'wednesday': 2, 'thursday': 3,
        'friday': 4, 'saturday': 5, 'sunday': 6,
        'mon': 0, 'tue': 1, 'wed': 2, 'thu': 3, 'fri': 4, 'sat': 5, 'sun': 6
    }

    @staticmethod
    def generate_every_other_weekday(
        start_date: datetime,
        end_date: datetime,
        weekday: str,
    ) -> List[datetime]:
        """Generate dates for every other occurrence of a specific weekday"""
        dates = []
        target_weekday = WeeklyPattern.WEEKDAY_MAP.get(weekday.lower())
        
        if target_weekday is None:
            raise ValueError(f"Invalid weekday: {weekday}")
        
        print(f"\nDebug: Generating every other {weekday}")
        print(f"Start date: {start_date.strftime('%Y-%m-%d (%A)')}")
        print(f"End date: {end_date.strftime('%Y-%m-%d (%A)')}")
        print(f"Target weekday: {target_weekday}")
        
        # Start from the beginning of the week of start_date
        current = start_date - timedelta(days=start_date.weekday())
        print(f"Adjusted to start of week: {current.strftime('%Y-%m-%d (%A)')}")
        
        # Move to the first target weekday
        while current.weekday() != target_weekday:
            current += timedelta(days=1)
        print(f"Moved to first target weekday: {current.strftime('%Y-%m-%d (%A)')}")
        
        # If we've moved past the start date, go back by two weeks
        if current < start_date:
            while current <= start_date:
                current += timedelta(weeks=2)
            current -= timedelta(weeks=2)
            print(f"Adjusted for start date: {current.strftime('%Y-%m-%d (%A)')}")
        
        # Generate dates for every other week
        print("\nGenerating dates:")
        while current <= end_date:
            if current >= start_date:
                dates.append(current)
                print(f"Added: {current.strftime('%Y-%m-%d (%A)')}")
            current += timedelta(weeks=2)
        
        return dates

    @staticmethod
    def generate_every_weekday(
        start_date: datetime,
        end_date: datetime,
        weekday: str,
        time_str: Optional[str] = None
    ) -> List[datetime]:
        """Generate dates for weekly patterns like 'every monday'"""
        dates = []
        
        # Convert weekday name to number (0 = Monday, 6 = Sunday)
        weekday_num = WeeklyPattern.WEEKDAY_MAP.get(weekday.lower())
        
        if weekday_num is None:
            raise ValueError(f"Invalid weekday: {weekday}")
        
        # Parse time if provided
        hour = 0
        minute = 0
        if time_str:
            # Handle 12-hour format with am/pm
            if 'am' in time_str.lower() or 'pm' in time_str.lower():
                time_str = time_str.lower().replace('am', '').replace('pm', '').strip()
                is_pm = 'pm' in time_str.lower()
                hour = int(time_str.split(':')[0]) % 12
                if is_pm:
                    hour += 12
                if ':' in time_str:
                    minute = int(time_str.split(':')[1])
            # Handle 24-hour format
            else:
                parts = time_str.split(':')
                hour = int(parts[0])
                if len(parts) > 1:
                    minute = int(parts[1])
        
        print("\nDebug: Generating every", weekday)
        print("Start date:", start_date.strftime("%Y-%m-%d (%A)"))
        print("End date:", end_date.strftime("%Y-%m-%d (%A)"))
        print("Target weekday:", weekday_num)
        
        # Start from the beginning of the week containing start_date
        current = start_date - timedelta(days=start_date.weekday())
        print("Adjusted to start of week:", current.strftime("%Y-%m-%d (%A)"))
        
        # Move to first target weekday
        if current.weekday() <= weekday_num:
            current += timedelta(days=weekday_num - current.weekday())
        else:
            current += timedelta(days=7 - (current.weekday() - weekday_num))
        print("Moved to first target weekday:", current.strftime("%Y-%m-%d (%A)"))
        
        # Adjust if we're before start_date
        if current < start_date:
            days_to_add = (weekday_num - start_date.weekday()) % 7
            if days_to_add == 0:
                days_to_add = 7
            current = start_date + timedelta(days=days_to_add)
        print("Adjusted for start date:", current.strftime("%Y-%m-%d (%A)"))
        
        print("\nGenerating dates:")
        while current <= end_date:
            # Set the time for this date
            target_date = current.replace(hour=hour, minute=minute)
            if start_date <= target_date <= end_date:
                print("Added:", target_date.strftime("%Y-%m-%d (%A)"))
                dates.append(target_date)
            current += timedelta(days=7)
        
        return dates

    @staticmethod
    def generate_every_n_weekday(
        start_date: datetime,
        end_date: datetime,
        weekday: str,
        interval: int
    ) -> List[datetime]:
        """Generate dates for every N weeks on a specific weekday"""
        dates = []
        target_weekday = WeeklyPattern.WEEKDAY_MAP.get(weekday.lower())
        
        if target_weekday is None:
            raise ValueError(f"Invalid weekday: {weekday}")
        
        if interval < 1:
            raise ValueError(f"Interval must be at least 1, got {interval}")
        
        print(f"\nDebug: Generating every {interval} weeks on {weekday}")
        print(f"Start date: {start_date.strftime('%Y-%m-%d (%A)')}")
        print(f"End date: {end_date.strftime('%Y-%m-%d (%A)')}")
        print(f"Target weekday: {target_weekday}")
        print(f"Interval: {interval}")
        
        # Start from the beginning of the week of start_date
        current = start_date - timedelta(days=start_date.weekday())
        print(f"Adjusted to start of week: {current.strftime('%Y-%m-%d (%A)')}")
        
        # Move to the first target weekday
        while current.weekday() != target_weekday:
            current += timedelta(days=1)
        print(f"Moved to first target weekday: {current.strftime('%Y-%m-%d (%A)')}")
        
        # If we've moved past the start date, go back by N weeks
        if current < start_date:
            while current <= start_date:
                current += timedelta(weeks=interval)
            current -= timedelta(weeks=interval)
            print(f"Adjusted for start date: {current.strftime('%Y-%m-%d (%A)')}")
        
        # Generate dates for every N weeks
        print("\nGenerating dates:")
        while current <= end_date:
            if current >= start_date:
                dates.append(current)
                print(f"Added: {current.strftime('%Y-%m-%d (%A)')}")
            current += timedelta(weeks=interval)
        
        return dates
