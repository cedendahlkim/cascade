# Task: gen-numtheory-is_perfect_square-9266 | Score: 100% | 2026-02-15T11:13:41.014179

import math
n = int(input())
print('yes' if n >= 0 and int(math.isqrt(n))**2 == n else 'no')