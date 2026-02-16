# Task: gen-numtheory-divisors-9936 | Score: 100% | 2026-02-13T09:43:28.005414

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))