# Task: gen-numtheory-is_perfect_square-4177 | Score: 100% | 2026-02-13T16:06:53.886869

import math
n = int(input())
print('yes' if n >= 0 and int(math.isqrt(n))**2 == n else 'no')