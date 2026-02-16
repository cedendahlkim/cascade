# Task: gen-numtheory-divisors-4728 | Score: 100% | 2026-02-14T12:04:51.723565

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))