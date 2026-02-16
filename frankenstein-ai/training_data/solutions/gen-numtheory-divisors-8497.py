# Task: gen-numtheory-divisors-8497 | Score: 100% | 2026-02-13T19:35:36.814373

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))