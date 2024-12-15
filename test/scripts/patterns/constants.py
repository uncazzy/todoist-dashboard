"""Constants and patterns used for recurring task generation"""

# Base frequencies
FREQUENCIES = [
    "daily",      # every day
    "workday",    # every workday (Mon-Fri)
    "weekend",    # every weekend (Sat-Sun)
    "weekly",     # every week
    "monthly",    # every month
    "yearly"      # every year
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
