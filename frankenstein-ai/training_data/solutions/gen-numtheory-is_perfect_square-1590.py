# Task: gen-numtheory-is_perfect_square-1590 | Score: 100% | 2026-02-13T14:01:32.333149

import math
n = int(input())
print('yes' if n >= 0 and int(math.isqrt(n))**2 == n else 'no')