# Task: gen-numtheory-is_perfect_square-9578 | Score: 100% | 2026-02-15T07:52:56.285322

import math
n = int(input())
print('yes' if n >= 0 and int(math.isqrt(n))**2 == n else 'no')