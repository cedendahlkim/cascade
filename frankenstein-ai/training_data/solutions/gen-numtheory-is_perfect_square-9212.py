# Task: gen-numtheory-is_perfect_square-9212 | Score: 100% | 2026-02-14T12:13:41.355199

import math
n = int(input())
print('yes' if n >= 0 and int(math.isqrt(n))**2 == n else 'no')