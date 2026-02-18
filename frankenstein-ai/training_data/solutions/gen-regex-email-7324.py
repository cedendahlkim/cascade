# Task: gen-regex-email-7324 | Score: 100% | 2026-02-17T20:32:55.703207

import re

line = input()
emails = set(re.findall(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", line))
print(*sorted(emails))