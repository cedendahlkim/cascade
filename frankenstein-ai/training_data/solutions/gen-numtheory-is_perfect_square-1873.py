# Task: gen-numtheory-is_perfect_square-1873 | Score: 100% | 2026-02-10T15:40:59.970212

import math

n = int(input())
sqrt_n = int(math.sqrt(n))
if sqrt_n * sqrt_n == n:
  print('yes')
else:
  print('no')