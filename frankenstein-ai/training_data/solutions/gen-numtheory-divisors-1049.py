# Task: gen-numtheory-divisors-1049 | Score: 100% | 2026-02-15T09:16:36.745802

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))