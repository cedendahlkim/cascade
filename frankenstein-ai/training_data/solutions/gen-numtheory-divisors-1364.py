# Task: gen-numtheory-divisors-1364 | Score: 100% | 2026-02-13T10:01:51.983527

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))