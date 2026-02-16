# Task: gen-numtheory-is_perfect_square-8696 | Score: 100% | 2026-02-13T14:31:06.698304

import math
n = int(input())
print('yes' if n >= 0 and int(math.isqrt(n))**2 == n else 'no')