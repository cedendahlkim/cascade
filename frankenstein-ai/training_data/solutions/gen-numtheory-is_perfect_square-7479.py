# Task: gen-numtheory-is_perfect_square-7479 | Score: 100% | 2026-02-12T20:53:25.214540

import math

n = int(input())
sqrt_n = int(math.sqrt(n))
if sqrt_n * sqrt_n == n:
  print('yes')
else:
  print('no')