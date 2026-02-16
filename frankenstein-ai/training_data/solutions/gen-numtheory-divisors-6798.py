# Task: gen-numtheory-divisors-6798 | Score: 100% | 2026-02-15T08:24:21.518728

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))