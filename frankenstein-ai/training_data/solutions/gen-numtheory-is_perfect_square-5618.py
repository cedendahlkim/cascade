# Task: gen-numtheory-is_perfect_square-5618 | Score: 100% | 2026-02-15T09:34:48.641561

import math
n = int(input())
print('yes' if n >= 0 and int(math.isqrt(n))**2 == n else 'no')