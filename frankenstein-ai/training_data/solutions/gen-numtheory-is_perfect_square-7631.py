# Task: gen-numtheory-is_perfect_square-7631 | Score: 100% | 2026-02-15T07:52:34.436137

import math
n = int(input())
print('yes' if n >= 0 and int(math.isqrt(n))**2 == n else 'no')