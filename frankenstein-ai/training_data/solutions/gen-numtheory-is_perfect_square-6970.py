# Task: gen-numtheory-is_perfect_square-6970 | Score: 100% | 2026-02-13T12:44:04.853699

import math
n = int(input())
print('yes' if n >= 0 and int(math.isqrt(n))**2 == n else 'no')