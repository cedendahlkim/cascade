# Task: gen-numtheory-is_perfect_square-4919 | Score: 100% | 2026-02-12T18:13:20.173040

import math

n = int(input())
sqrt_n = int(math.sqrt(n))
if sqrt_n * sqrt_n == n:
  print('yes')
else:
  print('no')