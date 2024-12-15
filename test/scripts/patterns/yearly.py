from datetime import datetime, timedelta
from typing import List, Optional
from .constants import MONTHS

class YearlyPattern:
    @staticmethod
    def generate_yearly_by_date(
        start_date: datetime,
        end_date: datetime,
        month: str,
        day: str,
        interval: int = 1
    ) -> List[datetime]:
        """Generate dates for yearly patterns like 'every January 1st'"""
        dates = []
        current = start_date

        # Convert month name to number (1-12)
        month_num = MONTHS.index(month.lower()) + 1
        
        # Convert day to number
        day_num = int(''.join(filter(str.isdigit, day)))

        while current <= end_date:
            # Check if we're in the right month
            if current.month == month_num:
                # Create date for this month/day
                target_date = current.replace(day=day_num)
                if start_date <= target_date <= end_date:
                    dates.append(target_date)
                
                # Move to next year
                current = current.replace(year=current.year + interval)
            else:
                # Move to the first day of the target month
                if current.month < month_num:
                    current = current.replace(month=month_num, day=1)
                else:
                    current = current.replace(year=current.year + interval, month=month_num, day=1)

        return dates
