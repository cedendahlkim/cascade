# Task: gen-numtheory-divisors-7290 | Score: 100% | 2026-02-14T12:37:23.970952

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))