# Task: gen-numtheory-is_perfect_square-9343 | Score: 100% | 2026-02-15T07:58:51.411262

import math
n = int(input())
print('yes' if n >= 0 and int(math.isqrt(n))**2 == n else 'no')