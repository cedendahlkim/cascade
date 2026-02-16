# Task: gen-numtheory-is_perfect_square-1361 | Score: 100% | 2026-02-15T08:05:59.405631

import math
n = int(input())
print('yes' if n >= 0 and int(math.isqrt(n))**2 == n else 'no')