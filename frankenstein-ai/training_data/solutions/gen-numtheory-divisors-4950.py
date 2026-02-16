# Task: gen-numtheory-divisors-4950 | Score: 100% | 2026-02-15T10:09:47.119614

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))