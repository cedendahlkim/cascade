# Task: gen-numtheory-divisors-1494 | Score: 100% | 2026-02-17T20:12:44.821678

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))