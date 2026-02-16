# Task: gen-numtheory-divisors-3984 | Score: 100% | 2026-02-13T13:09:39.026988

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))