# Task: gen-numtheory-is_perfect_square-6546 | Score: 100% | 2026-02-15T09:51:42.448699

import math
n = int(input())
print('yes' if n >= 0 and int(math.isqrt(n))**2 == n else 'no')