# Task: gen-numtheory-divisors-4625 | Score: 100% | 2026-02-15T13:00:21.143195

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))