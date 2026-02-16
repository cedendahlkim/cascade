# Task: gen-numtheory-is_perfect_square-8334 | Score: 100% | 2026-02-12T16:39:01.340966

import math

n = int(input())
sqrt_n = int(math.sqrt(n))
if sqrt_n * sqrt_n == n:
  print('yes')
else:
  print('no')