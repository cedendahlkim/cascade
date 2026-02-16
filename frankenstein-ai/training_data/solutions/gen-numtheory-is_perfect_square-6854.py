# Task: gen-numtheory-is_perfect_square-6854 | Score: 100% | 2026-02-12T14:15:43.319107

import math

n = int(input())
sqrt_n = int(math.sqrt(n))
if sqrt_n * sqrt_n == n:
    print('yes')
else:
    print('no')