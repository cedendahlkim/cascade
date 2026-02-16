# Task: gen-numtheory-is_perfect_square-6995 | Score: 100% | 2026-02-12T18:51:51.802453

import math

n = int(input())
sqrt_n = int(math.sqrt(n))
if sqrt_n * sqrt_n == n:
  print('yes')
else:
  print('no')