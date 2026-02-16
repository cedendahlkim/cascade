# Task: gen-numtheory-is_perfect_square-5329 | Score: 100% | 2026-02-13T09:33:17.191253

import math
n = int(input())
print('yes' if n >= 0 and int(math.isqrt(n))**2 == n else 'no')