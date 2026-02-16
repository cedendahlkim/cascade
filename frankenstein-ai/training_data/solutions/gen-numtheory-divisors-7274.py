# Task: gen-numtheory-divisors-7274 | Score: 100% | 2026-02-15T12:03:56.389833

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))