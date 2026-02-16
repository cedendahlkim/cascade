# Task: gen-numtheory-divisors-4482 | Score: 100% | 2026-02-15T09:51:42.090953

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))