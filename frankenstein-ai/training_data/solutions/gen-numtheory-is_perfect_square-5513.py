# Task: gen-numtheory-is_perfect_square-5513 | Score: 100% | 2026-02-13T20:50:14.078926

import math
n = int(input())
print('yes' if n >= 0 and int(math.isqrt(n))**2 == n else 'no')