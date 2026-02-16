# Task: gen-numtheory-is_perfect_square-7771 | Score: 100% | 2026-02-15T13:00:23.204759

import math
n = int(input())
print('yes' if n >= 0 and int(math.isqrt(n))**2 == n else 'no')