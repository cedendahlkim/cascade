# Task: gen-numtheory-divisors-4783 | Score: 100% | 2026-02-13T11:27:22.032230

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))