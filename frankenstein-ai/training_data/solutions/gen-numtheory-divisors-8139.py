# Task: gen-numtheory-divisors-8139 | Score: 100% | 2026-02-15T09:51:27.931170

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))