# Task: gen-numtheory-is_perfect_square-2118 | Score: 100% | 2026-02-12T12:13:47.811814

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