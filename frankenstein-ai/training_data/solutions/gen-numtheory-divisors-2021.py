# Task: gen-numtheory-divisors-2021 | Score: 100% | 2026-02-15T08:05:56.115168

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))