# Task: gen-numtheory-divisors-1707 | Score: 100% | 2026-02-13T20:49:41.656567

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))