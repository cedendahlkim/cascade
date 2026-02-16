# Task: gen-numtheory-divisors-2674 | Score: 100% | 2026-02-15T07:58:49.852598

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))