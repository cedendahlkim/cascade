# Task: gen-numtheory-divisors-2413 | Score: 100% | 2026-02-13T12:05:47.007358

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))