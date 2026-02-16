# Task: gen-numtheory-is_perfect_square-4091 | Score: 100% | 2026-02-13T19:48:16.409201

import math
n = int(input())
print('yes' if n >= 0 and int(math.isqrt(n))**2 == n else 'no')