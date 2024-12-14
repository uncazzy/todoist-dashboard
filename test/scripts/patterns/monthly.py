from datetime import datetime, timedelta
from typing import List, Optional
from calendar import monthrange

class MonthlyPattern:
    WEEKDAY_MAP = {
        'monday': 0, 'tuesday': 1, 'wednesday': 2, 'thursday': 3,
        'friday': 4, 'saturday': 5, 'sunday': 6,
        'mon': 0, 'tue': 1, 'wed': 2, 'thu': 3, 'fri': 4, 'sat': 5, 'sun': 6
    }

    WEEK_NUMBER_MAP = {
        '1st': 1, 'first': 1,
        '2nd': 2, 'second': 2,
        '3rd': 3, 'third': 3,
        '4th': 4, 'fourth': 4,
        'last': -1
    }

    @staticmethod
    def _get_last_day_of_month(date: datetime) -> int:
        """Get the last day of the month for a given date"""
        return monthrange(date.year, date.month)[1]

    @staticmethod
    def _get_next_month_date(date: datetime, day: int) -> datetime:
        """Get the date for a specific day in the next month, handling month boundaries"""
        if date.month == 12:
            next_year = date.year + 1
            next_month = 1
        else:
            next_year = date.year
            next_month = date.month + 1
        
        # Handle 'last' day of month
        if day == -1:
            day = monthrange(next_year, next_month)[1]
        
        # Ensure day is valid for the month
        max_days = monthrange(next_year, next_month)[1]
        day = min(day, max_days)
        
        return datetime(next_year, next_month, day)

    @staticmethod
    def generate_monthly_by_date(
        start_date: datetime,
        end_date: datetime,
        day: str,
    ) -> List[datetime]:
        """Generate dates for monthly recurrence by date (e.g., 1st, 15th, last)"""
        dates = []
        
        # Handle 'last' day of month
        if day.lower() in ['last', 'last day']:
            target_day = -1
        else:
            # Remove any ordinal indicators (st, nd, rd, th)
            day = day.lower().replace('st', '').replace('nd', '').replace('rd', '').replace('th', '')
            target_day = int(day)
        
        current = start_date.replace(day=1)  # Start from beginning of month
        
        # Move to the target day
        if target_day == -1:
            current = current.replace(day=MonthlyPattern._get_last_day_of_month(current))
        else:
            # Ensure day is valid for the month
            max_days = MonthlyPattern._get_last_day_of_month(current)
            current = current.replace(day=min(target_day, max_days))
        
        # If we're before the start date, move to next month
        if current < start_date:
            current = MonthlyPattern._get_next_month_date(current, target_day)
        
        while current <= end_date:
            if current >= start_date:
                dates.append(current)
            current = MonthlyPattern._get_next_month_date(current, target_day)
        
        return dates

    @staticmethod
    def generate_monthly_by_weekday(
        start_date: datetime,
        end_date: datetime,
        week_number: str,
        weekday: str,
    ) -> List[datetime]:
        """Generate dates for monthly recurrence by weekday (e.g., first Monday)"""
        dates = []
        
        target_week = MonthlyPattern.WEEK_NUMBER_MAP.get(week_number.lower())
        if target_week is None:
            raise ValueError(f"Invalid week number: {week_number}")
        
        target_weekday = MonthlyPattern.WEEKDAY_MAP.get(weekday.lower())
        if target_weekday is None:
            raise ValueError(f"Invalid weekday: {weekday}")
        
        current = start_date.replace(day=1)  # Start from beginning of month
        
        while current <= end_date:
            # Find the first occurrence of the weekday in the month
            first_occurrence = current
            while first_occurrence.weekday() != target_weekday:
                first_occurrence += timedelta(days=1)
            
            # Calculate the target date based on week number
            if target_week > 0:
                target_date = first_occurrence + timedelta(weeks=target_week - 1)
            else:  # Last occurrence
                # Find the last occurrence by starting from the end of the month
                last_day = datetime(current.year, current.month, MonthlyPattern._get_last_day_of_month(current))
                target_date = last_day
                while target_date.weekday() != target_weekday:
                    target_date -= timedelta(days=1)
            
            # Check if the target date is still in the same month
            if target_date.month == current.month and target_date <= end_date and target_date >= start_date:
                dates.append(target_date)
            
            # Move to the first day of next month
            if current.month == 12:
                current = datetime(current.year + 1, 1, 1)
            else:
                current = datetime(current.year, current.month + 1, 1)
        
        return dates
