# Task: gen-numtheory-divisors-1468 | Score: 100% | 2026-02-13T19:48:16.093201

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))