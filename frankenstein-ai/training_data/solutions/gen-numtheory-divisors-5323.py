# Task: gen-numtheory-divisors-5323 | Score: 100% | 2026-02-13T20:17:12.923833

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))