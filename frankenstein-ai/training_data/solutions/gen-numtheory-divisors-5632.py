# Task: gen-numtheory-divisors-5632 | Score: 100% | 2026-02-15T08:06:06.195050

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))