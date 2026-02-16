# Task: gen-numtheory-is_perfect_square-7646 | Score: 100% | 2026-02-13T18:36:12.770242

import math
n = int(input())
print('yes' if n >= 0 and int(math.isqrt(n))**2 == n else 'no')