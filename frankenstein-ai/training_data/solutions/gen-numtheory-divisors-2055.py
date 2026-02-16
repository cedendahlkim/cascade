# Task: gen-numtheory-divisors-2055 | Score: 100% | 2026-02-13T20:50:38.069108

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))