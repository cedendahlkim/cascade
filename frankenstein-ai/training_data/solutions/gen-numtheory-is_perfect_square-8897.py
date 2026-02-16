# Task: gen-numtheory-is_perfect_square-8897 | Score: 100% | 2026-02-13T11:09:04.295511

import math
n = int(input())
print('yes' if n >= 0 and int(math.isqrt(n))**2 == n else 'no')