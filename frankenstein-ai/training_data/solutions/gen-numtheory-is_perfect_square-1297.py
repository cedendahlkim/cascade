# Task: gen-numtheory-is_perfect_square-1297 | Score: 100% | 2026-02-13T21:27:57.020720

import math
n = int(input())
print('yes' if n >= 0 and int(math.isqrt(n))**2 == n else 'no')