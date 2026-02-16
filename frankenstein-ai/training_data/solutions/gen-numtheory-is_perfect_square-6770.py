# Task: gen-numtheory-is_perfect_square-6770 | Score: 100% | 2026-02-14T12:04:50.572955

import math
n = int(input())
print('yes' if n >= 0 and int(math.isqrt(n))**2 == n else 'no')