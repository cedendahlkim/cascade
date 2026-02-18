# Task: gen-numtheory-divisors-2921 | Score: 100% | 2026-02-17T20:35:44.025043

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))