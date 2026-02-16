# Task: gen-numtheory-divisors-5796 | Score: 100% | 2026-02-13T16:06:54.952571

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))