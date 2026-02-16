# Task: gen-numtheory-is_perfect_square-6665 | Score: 100% | 2026-02-13T13:42:54.815806

import math
n = int(input())
print('yes' if n >= 0 and int(math.isqrt(n))**2 == n else 'no')