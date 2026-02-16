# Task: gen-numtheory-is_perfect_square-2687 | Score: 100% | 2026-02-15T12:03:44.555456

import math
n = int(input())
print('yes' if n >= 0 and int(math.isqrt(n))**2 == n else 'no')