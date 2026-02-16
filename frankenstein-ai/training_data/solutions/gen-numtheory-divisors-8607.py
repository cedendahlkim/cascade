# Task: gen-numtheory-divisors-8607 | Score: 100% | 2026-02-13T17:11:37.955676

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))