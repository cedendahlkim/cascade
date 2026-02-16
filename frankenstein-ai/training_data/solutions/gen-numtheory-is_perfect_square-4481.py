# Task: gen-numtheory-is_perfect_square-4481 | Score: 100% | 2026-02-12T14:16:53.232870

import math

n = int(input())

if n >= 0:
  sqrt_n = int(math.sqrt(n))
  if sqrt_n * sqrt_n == n:
    print("yes")
  else:
    print("no")
else:
  print("no")