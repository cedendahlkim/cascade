# Task: gen-numtheory-is_perfect_square-9059 | Score: 100% | 2026-02-13T13:42:27.895715

import math
n = int(input())
print('yes' if n >= 0 and int(math.isqrt(n))**2 == n else 'no')