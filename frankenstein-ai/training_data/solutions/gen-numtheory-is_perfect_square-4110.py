# Task: gen-numtheory-is_perfect_square-4110 | Score: 100% | 2026-02-15T08:14:57.286322

import math
n = int(input())
print('yes' if n >= 0 and int(math.isqrt(n))**2 == n else 'no')