# Task: gen-numtheory-is_perfect_square-1187 | Score: 100% | 2026-02-13T18:39:52.735183

import math
n = int(input())
print('yes' if n >= 0 and int(math.isqrt(n))**2 == n else 'no')