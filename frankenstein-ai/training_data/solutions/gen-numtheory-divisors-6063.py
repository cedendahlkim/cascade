# Task: gen-numtheory-divisors-6063 | Score: 100% | 2026-02-17T20:35:42.796373

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))