# Task: gen-numtheory-divisors-6751 | Score: 100% | 2026-02-14T13:11:13.770259

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))