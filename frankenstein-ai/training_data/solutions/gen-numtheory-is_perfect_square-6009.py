# Task: gen-numtheory-is_perfect_square-6009 | Score: 100% | 2026-02-10T15:40:38.079035

import math

n = int(input())

if n >= 0:
  sqrt_n = int(math.sqrt(n))
  if sqrt_n * sqrt_n == n:
    print('yes')
  else:
    print('no')
else:
  print('no')