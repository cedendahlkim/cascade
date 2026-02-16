# Task: gen-numtheory-divisors-7028 | Score: 100% | 2026-02-14T12:08:54.577676

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))