# Task: gen-numtheory-divisors-5343 | Score: 100% | 2026-02-13T19:35:32.096153

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))