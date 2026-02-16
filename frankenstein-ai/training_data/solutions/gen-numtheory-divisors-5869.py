# Task: gen-numtheory-divisors-5869 | Score: 100% | 2026-02-13T10:01:45.389009

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))