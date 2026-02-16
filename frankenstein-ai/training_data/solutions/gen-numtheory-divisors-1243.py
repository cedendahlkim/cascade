# Task: gen-numtheory-divisors-1243 | Score: 100% | 2026-02-13T18:36:13.150174

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))