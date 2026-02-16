# Task: gen-numtheory-is_perfect_square-8994 | Score: 100% | 2026-02-12T18:49:42.638136

import math

n = int(input())
sqrt_n = int(math.sqrt(n))
if sqrt_n * sqrt_n == n:
  print('yes')
else:
  print('no')