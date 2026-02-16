# Task: gen-numtheory-divisors-6158 | Score: 100% | 2026-02-15T08:36:03.363096

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))