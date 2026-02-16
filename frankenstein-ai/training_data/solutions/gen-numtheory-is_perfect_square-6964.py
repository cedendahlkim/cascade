# Task: gen-numtheory-is_perfect_square-6964 | Score: 100% | 2026-02-14T12:37:24.237574

import math
n = int(input())
print('yes' if n >= 0 and int(math.isqrt(n))**2 == n else 'no')