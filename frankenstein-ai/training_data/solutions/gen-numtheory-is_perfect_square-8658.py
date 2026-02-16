# Task: gen-numtheory-is_perfect_square-8658 | Score: 100% | 2026-02-13T10:01:51.313889

import math
n = int(input())
print('yes' if n >= 0 and int(math.isqrt(n))**2 == n else 'no')