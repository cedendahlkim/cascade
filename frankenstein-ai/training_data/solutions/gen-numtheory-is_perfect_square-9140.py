# Task: gen-numtheory-is_perfect_square-9140 | Score: 100% | 2026-02-15T07:52:37.808820

import math
n = int(input())
print('yes' if n >= 0 and int(math.isqrt(n))**2 == n else 'no')