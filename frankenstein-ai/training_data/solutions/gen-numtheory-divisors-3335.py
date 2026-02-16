# Task: gen-numtheory-divisors-3335 | Score: 100% | 2026-02-15T09:51:19.508012

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))