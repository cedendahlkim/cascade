# Task: gen-numtheory-divisors-2967 | Score: 100% | 2026-02-13T09:33:15.145347

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))