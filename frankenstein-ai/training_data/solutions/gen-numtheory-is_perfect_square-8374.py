# Task: gen-numtheory-is_perfect_square-8374 | Score: 100% | 2026-02-13T09:34:13.611547

import math
n = int(input())
print('yes' if n >= 0 and int(math.isqrt(n))**2 == n else 'no')