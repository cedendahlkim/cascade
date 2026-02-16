# Task: gen-numtheory-is_perfect_square-2666 | Score: 100% | 2026-02-12T12:11:11.675819

import math

n = int(input())
sqrt_n = int(math.sqrt(n))
if sqrt_n * sqrt_n == n:
  print('yes')
else:
  print('no')