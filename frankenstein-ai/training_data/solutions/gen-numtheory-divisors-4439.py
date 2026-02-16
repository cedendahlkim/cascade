# Task: gen-numtheory-divisors-4439 | Score: 100% | 2026-02-13T14:18:57.343378

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))