# Task: gen-numtheory-is_perfect_square-1058 | Score: 100% | 2026-02-13T20:17:11.711491

import math
n = int(input())
print('yes' if n >= 0 and int(math.isqrt(n))**2 == n else 'no')