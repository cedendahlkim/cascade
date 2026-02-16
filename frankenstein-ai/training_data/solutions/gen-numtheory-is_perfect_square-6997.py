# Task: gen-numtheory-is_perfect_square-6997 | Score: 100% | 2026-02-12T19:12:36.202632

import math

n = int(input())
sqrt_n = int(math.sqrt(n))
if sqrt_n * sqrt_n == n:
  print('yes')
else:
  print('no')