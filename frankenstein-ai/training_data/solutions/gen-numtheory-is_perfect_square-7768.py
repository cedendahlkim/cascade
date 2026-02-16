# Task: gen-numtheory-is_perfect_square-7768 | Score: 100% | 2026-02-13T21:28:00.368294

import math
n = int(input())
print('yes' if n >= 0 and int(math.isqrt(n))**2 == n else 'no')