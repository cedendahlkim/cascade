# Task: gen-numtheory-is_perfect_square-9156 | Score: 100% | 2026-02-12T13:18:37.171366

import math

n = int(input())
sqrt_n = int(math.sqrt(n))
if sqrt_n * sqrt_n == n:
  print('yes')
else:
  print('no')