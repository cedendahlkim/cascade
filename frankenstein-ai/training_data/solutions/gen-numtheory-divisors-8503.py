# Task: gen-numtheory-divisors-8503 | Score: 100% | 2026-02-15T12:03:49.461933

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))