# Task: gen-numtheory-divisors-5295 | Score: 100% | 2026-02-13T14:01:28.137380

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))