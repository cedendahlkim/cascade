# Task: gen-numtheory-is_perfect_square-4881 | Score: 100% | 2026-02-12T18:10:21.216999

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