# Task: gen-numtheory-is_perfect_square-6941 | Score: 100% | 2026-02-13T14:01:20.059459

import math
n = int(input())
print('yes' if n >= 0 and int(math.isqrt(n))**2 == n else 'no')