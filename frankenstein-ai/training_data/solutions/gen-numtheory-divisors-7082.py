# Task: gen-numtheory-divisors-7082 | Score: 100% | 2026-02-13T20:50:15.445751

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))