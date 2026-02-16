# Task: gen-numtheory-is_perfect_square-9601 | Score: 100% | 2026-02-15T12:03:51.294369

import math
n = int(input())
print('yes' if n >= 0 and int(math.isqrt(n))**2 == n else 'no')