# Task: gen-numtheory-divisors-8054 | Score: 100% | 2026-02-15T08:14:57.604306

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))