# Task: gen-numtheory-is_perfect_square-1123 | Score: 100% | 2026-02-12T16:38:41.160100

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