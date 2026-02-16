# Task: gen-numtheory-is_perfect_square-9380 | Score: 100% | 2026-02-15T08:05:51.151840

import math
n = int(input())
print('yes' if n >= 0 and int(math.isqrt(n))**2 == n else 'no')