# Task: gen-numtheory-is_perfect_square-1211 | Score: 100% | 2026-02-15T12:03:55.362374

import math
n = int(input())
print('yes' if n >= 0 and int(math.isqrt(n))**2 == n else 'no')