# Task: gen-regex-replace-censor_numbers-2071 | Score: 100% | 2026-02-17T20:32:47.083827

import re

s = input()
result = re.sub(r'\d', '*', s)
print(result)