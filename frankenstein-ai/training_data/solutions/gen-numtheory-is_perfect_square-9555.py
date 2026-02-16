# Task: gen-numtheory-is_perfect_square-9555 | Score: 100% | 2026-02-15T08:06:09.116426

import math
n = int(input())
print('yes' if n >= 0 and int(math.isqrt(n))**2 == n else 'no')