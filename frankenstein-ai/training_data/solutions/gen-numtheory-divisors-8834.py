# Task: gen-numtheory-divisors-8834 | Score: 100% | 2026-02-13T13:42:26.235261

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))