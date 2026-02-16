# Task: gen-numtheory-is_perfect_square-3817 | Score: 100% | 2026-02-13T19:48:22.919540

import math
n = int(input())
print('yes' if n >= 0 and int(math.isqrt(n))**2 == n else 'no')