# Task: gen-numtheory-is_perfect_square-4805 | Score: 100% | 2026-02-13T20:49:42.987223

import math
n = int(input())
print('yes' if n >= 0 and int(math.isqrt(n))**2 == n else 'no')