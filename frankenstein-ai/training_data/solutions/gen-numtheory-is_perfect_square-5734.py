# Task: gen-numtheory-is_perfect_square-5734 | Score: 100% | 2026-02-13T11:03:09.126454

import math
n = int(input())
print('yes' if n >= 0 and int(math.isqrt(n))**2 == n else 'no')