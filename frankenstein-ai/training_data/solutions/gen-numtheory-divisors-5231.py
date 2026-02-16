# Task: gen-numtheory-divisors-5231 | Score: 100% | 2026-02-13T15:28:43.582184

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))