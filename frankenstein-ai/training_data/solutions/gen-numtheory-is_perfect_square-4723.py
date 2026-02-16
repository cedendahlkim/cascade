# Task: gen-numtheory-is_perfect_square-4723 | Score: 100% | 2026-02-13T16:48:12.138545

import math
n = int(input())
print('yes' if n >= 0 and int(math.isqrt(n))**2 == n else 'no')