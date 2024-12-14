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
    ) -> List[datetime]:
        """Generate dates for every occurrence of a specific weekday"""
        dates = []
        target_weekday = WeeklyPattern.WEEKDAY_MAP.get(weekday.lower())
        
        if target_weekday is None:
            raise ValueError(f"Invalid weekday: {weekday}")
        
        print(f"\nDebug: Generating every {weekday}")
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
        
        # If we've moved past the start date, go back by one week
        if current < start_date:
            while current <= start_date:
                current += timedelta(weeks=1)
            current -= timedelta(weeks=1)
            print(f"Adjusted for start date: {current.strftime('%Y-%m-%d (%A)')}")
        
        # Generate dates for every week
        print("\nGenerating dates:")
        while current <= end_date:
            if current >= start_date:
                dates.append(current)
                print(f"Added: {current.strftime('%Y-%m-%d (%A)')}")
            current += timedelta(weeks=1)
        
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
