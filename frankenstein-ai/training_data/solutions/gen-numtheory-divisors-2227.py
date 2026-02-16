# Task: gen-numtheory-divisors-2227 | Score: 100% | 2026-02-15T08:36:03.752828

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))