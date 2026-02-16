# Task: gen-numtheory-is_perfect_square-4630 | Score: 100% | 2026-02-12T17:31:12.568686

import math

n = int(input())
sqrt_n = int(math.sqrt(n))
if sqrt_n * sqrt_n == n:
  print('yes')
else:
  print('no')