# Task: gen-numtheory-is_perfect_square-8531 | Score: 100% | 2026-02-13T15:28:53.371347

import math
n = int(input())
print('yes' if n >= 0 and int(math.isqrt(n))**2 == n else 'no')