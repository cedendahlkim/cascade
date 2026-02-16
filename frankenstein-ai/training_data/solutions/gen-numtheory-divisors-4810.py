# Task: gen-numtheory-divisors-4810 | Score: 100% | 2026-02-13T13:09:36.962694

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))