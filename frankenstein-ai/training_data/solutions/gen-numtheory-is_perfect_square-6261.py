# Task: gen-numtheory-is_perfect_square-6261 | Score: 100% | 2026-02-12T17:29:47.127045

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