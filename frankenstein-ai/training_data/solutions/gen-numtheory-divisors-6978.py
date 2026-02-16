# Task: gen-numtheory-divisors-6978 | Score: 100% | 2026-02-15T08:14:49.293315

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))