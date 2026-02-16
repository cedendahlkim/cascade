# Task: gen-numtheory-divisors-2129 | Score: 100% | 2026-02-13T13:47:47.582822

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))