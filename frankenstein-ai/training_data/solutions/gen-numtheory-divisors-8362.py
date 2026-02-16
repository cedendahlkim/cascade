# Task: gen-numtheory-divisors-8362 | Score: 100% | 2026-02-13T18:37:51.770119

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))