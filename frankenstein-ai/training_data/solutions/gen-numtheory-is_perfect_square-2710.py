# Task: gen-numtheory-is_perfect_square-2710 | Score: 100% | 2026-02-15T09:01:42.671408

import math
n = int(input())
print('yes' if n >= 0 and int(math.isqrt(n))**2 == n else 'no')