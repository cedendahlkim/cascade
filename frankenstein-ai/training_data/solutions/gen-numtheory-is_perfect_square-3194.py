# Task: gen-numtheory-is_perfect_square-3194 | Score: 100% | 2026-02-13T17:36:10.910441

import math
n = int(input())
print('yes' if n >= 0 and int(math.isqrt(n))**2 == n else 'no')