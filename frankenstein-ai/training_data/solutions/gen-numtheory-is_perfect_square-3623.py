# Task: gen-numtheory-is_perfect_square-3623 | Score: 100% | 2026-02-12T12:19:28.942597

import math

n = int(input())
sqrt_n = int(math.sqrt(n))
if sqrt_n * sqrt_n == n:
  print('yes')
else:
  print('no')