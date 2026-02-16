# Task: gen-numtheory-divisors-2354 | Score: 100% | 2026-02-14T12:37:41.754041

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))