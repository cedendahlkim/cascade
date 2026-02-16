# Task: gen-numtheory-is_perfect_square-2623 | Score: 100% | 2026-02-12T20:53:14.749023

import math

n = int(input())
sqrt_n = int(math.sqrt(n))
if sqrt_n * sqrt_n == n:
  print('yes')
else:
  print('no')