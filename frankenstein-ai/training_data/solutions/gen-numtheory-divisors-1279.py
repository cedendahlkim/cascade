# Task: gen-numtheory-divisors-1279 | Score: 100% | 2026-02-14T12:20:52.486754

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))