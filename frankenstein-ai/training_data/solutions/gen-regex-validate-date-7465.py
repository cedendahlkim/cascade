# Task: gen-regex-validate-date-7465 | Score: 100% | 2026-02-17T20:33:03.426980

import re

def is_valid_date(date_str):
    pattern = r"^\d{4}-\d{2}-\d{2}$"
    if re.match(pattern, date_str):
        return 'yes'
    else:
        return 'no'

date_string = input()
print(is_valid_date(date_string))