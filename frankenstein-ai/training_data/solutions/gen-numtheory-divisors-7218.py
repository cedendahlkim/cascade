# Task: gen-numtheory-divisors-7218 | Score: 100% | 2026-02-17T20:35:40.629643

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))