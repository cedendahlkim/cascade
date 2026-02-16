# Task: gen-numtheory-is_perfect_square-4154 | Score: 100% | 2026-02-12T14:13:22.347216

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