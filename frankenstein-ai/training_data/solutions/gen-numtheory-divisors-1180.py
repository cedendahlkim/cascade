# Task: gen-numtheory-divisors-1180 | Score: 100% | 2026-02-13T20:49:40.641095

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))