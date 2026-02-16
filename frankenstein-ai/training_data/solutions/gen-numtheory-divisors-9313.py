# Task: gen-numtheory-divisors-9313 | Score: 100% | 2026-02-14T12:02:56.310161

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))