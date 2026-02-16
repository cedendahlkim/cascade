# Task: gen-numtheory-divisors-9931 | Score: 100% | 2026-02-13T13:47:41.187344

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))