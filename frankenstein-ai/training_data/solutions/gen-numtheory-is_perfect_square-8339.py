# Task: gen-numtheory-is_perfect_square-8339 | Score: 100% | 2026-02-12T13:12:58.486618

import math

n = int(input())
sqrt_n = int(math.sqrt(n))
if sqrt_n * sqrt_n == n:
  print('yes')
else:
  print('no')