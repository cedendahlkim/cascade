# Task: gen-numtheory-is_perfect_square-2819 | Score: 100% | 2026-02-13T20:50:41.471459

import math
n = int(input())
print('yes' if n >= 0 and int(math.isqrt(n))**2 == n else 'no')