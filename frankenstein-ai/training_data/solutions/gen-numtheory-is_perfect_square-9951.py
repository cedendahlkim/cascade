# Task: gen-numtheory-is_perfect_square-9951 | Score: 100% | 2026-02-13T11:03:09.526948

import math
n = int(input())
print('yes' if n >= 0 and int(math.isqrt(n))**2 == n else 'no')