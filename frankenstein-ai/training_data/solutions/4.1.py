# Task: 4.1 | Score: 100% | 2026-02-13T18:31:19.706393

import math

def is_prime(n):
    if n < 2:
        return "not prime"
    for i in range(2, int(math.sqrt(n)) + 1):
        if n % i == 0:
            return "not prime"
    return "prime"

n = int(input())
print(is_prime(n))