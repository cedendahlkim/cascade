# Task: gen-numtheory-is_perfect_square-4980 | Score: 100% | 2026-02-13T15:28:49.886523

import math
n = int(input())
print('yes' if n >= 0 and int(math.isqrt(n))**2 == n else 'no')