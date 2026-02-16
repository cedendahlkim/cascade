# Task: gen-numtheory-is_perfect_square-7455 | Score: 100% | 2026-02-13T19:48:20.988814

import math
n = int(input())
print('yes' if n >= 0 and int(math.isqrt(n))**2 == n else 'no')