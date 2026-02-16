# Task: gen-numtheory-is_perfect_square-5235 | Score: 100% | 2026-02-13T13:47:51.760497

import math
n = int(input())
print('yes' if n >= 0 and int(math.isqrt(n))**2 == n else 'no')