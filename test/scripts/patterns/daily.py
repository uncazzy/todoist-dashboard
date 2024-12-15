from datetime import datetime, timedelta
from typing import List, Optional

class DailyPattern:
    WORKDAYS = [0, 1, 2, 3, 4]  # Monday = 0, Friday = 4
    WEEKENDS = [5, 6]           # Saturday = 5, Sunday = 6

    @staticmethod
    def generate_daily(
        start_date: datetime,
        end_date: datetime,
        interval: int = 1
    ) -> List[datetime]:
        """Generate dates for every day or every N days"""
        dates = []
        current = start_date

        while current <= end_date:
            dates.append(current)
            # Create new datetime with timezone preserved
            next_date = current + timedelta(days=interval)
            if current.tzinfo is not None:
                next_date = next_date.replace(tzinfo=current.tzinfo)
            current = next_date

        return dates

    @staticmethod
    def generate_workdays(
        start_date: datetime,
        end_date: datetime
    ) -> List[datetime]:
        """Generate dates for workdays (Monday through Friday)"""
        dates = []
        current = start_date

        while current <= end_date:
            if current.weekday() in DailyPattern.WORKDAYS:
                dates.append(current)
            
            # If it's Friday, skip to Monday
            if current.weekday() == 4:  # Friday
                current += timedelta(days=3)
            else:
                current += timedelta(days=1)

        return dates

    @staticmethod
    def generate_weekends(
        start_date: datetime,
        end_date: datetime
    ) -> List[datetime]:
        """Generate dates for weekends (Saturday and Sunday)"""
        dates = []
        current = start_date

        while current <= end_date:
            if current.weekday() in DailyPattern.WEEKENDS:
                dates.append(current)
            
            # If it's Sunday, skip to Saturday
            if current.weekday() == 6:  # Sunday
                current += timedelta(days=6)
            else:
                current += timedelta(days=1)

        return dates

    @staticmethod
    def generate_every_other_day(
        start_date: datetime,
        end_date: datetime,
        include_workdays_only: bool = False
    ) -> List[datetime]:
        """Generate dates for every other day, with option to only include workdays"""
        if not include_workdays_only:
            return DailyPattern.generate_daily(start_date, end_date, interval=2)
        
        dates = []
        current = start_date
        skip_next = False

        while current <= end_date:
            if current.weekday() in DailyPattern.WORKDAYS and not skip_next:
                dates.append(current)
                skip_next = True
            else:
                skip_next = False
            
            # If it's Friday, skip to Monday
            if current.weekday() == 4:  # Friday
                current += timedelta(days=3)
            else:
                current += timedelta(days=1)

        return dates
