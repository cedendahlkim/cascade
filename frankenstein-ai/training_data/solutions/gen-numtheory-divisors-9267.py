# Task: gen-numtheory-divisors-9267 | Score: 100% | 2026-02-17T20:12:46.091739

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))