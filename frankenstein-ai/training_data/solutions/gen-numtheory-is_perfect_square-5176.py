# Task: gen-numtheory-is_perfect_square-5176 | Score: 100% | 2026-02-13T10:01:52.678793

import math
n = int(input())
print('yes' if n >= 0 and int(math.isqrt(n))**2 == n else 'no')