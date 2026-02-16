# Task: gen-numtheory-divisors-1257 | Score: 100% | 2026-02-14T12:14:09.760797

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))