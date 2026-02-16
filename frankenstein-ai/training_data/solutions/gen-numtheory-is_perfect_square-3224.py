# Task: gen-numtheory-is_perfect_square-3224 | Score: 100% | 2026-02-14T13:12:27.336800

import math
n = int(input())
print('yes' if n >= 0 and int(math.isqrt(n))**2 == n else 'no')