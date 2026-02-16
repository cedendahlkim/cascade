# Task: gen-numtheory-is_perfect_square-8959 | Score: 100% | 2026-02-13T18:33:57.352882

import math
n = int(input())
print('yes' if n >= 0 and int(math.isqrt(n))**2 == n else 'no')