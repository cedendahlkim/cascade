# Task: gen-numtheory-is_perfect_square-8592 | Score: 100% | 2026-02-14T13:12:27.079235

import math
n = int(input())
print('yes' if n >= 0 and int(math.isqrt(n))**2 == n else 'no')