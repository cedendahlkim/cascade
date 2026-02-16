# Task: gen-numtheory-is_perfect_square-5726 | Score: 100% | 2026-02-12T13:13:10.710091

import math

n = int(input())
sqrt_n = int(math.sqrt(n))
if sqrt_n * sqrt_n == n:
  print('yes')
else:
  print('no')