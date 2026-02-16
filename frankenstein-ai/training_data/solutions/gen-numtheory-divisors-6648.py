# Task: gen-numtheory-divisors-6648 | Score: 100% | 2026-02-14T12:13:41.012289

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))