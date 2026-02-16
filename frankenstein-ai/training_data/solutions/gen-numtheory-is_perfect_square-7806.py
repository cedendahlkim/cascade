# Task: gen-numtheory-is_perfect_square-7806 | Score: 100% | 2026-02-13T14:18:55.767386

import math
n = int(input())
print('yes' if n >= 0 and int(math.isqrt(n))**2 == n else 'no')