# Task: gen-numtheory-divisors-4983 | Score: 100% | 2026-02-13T09:42:32.115254

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))