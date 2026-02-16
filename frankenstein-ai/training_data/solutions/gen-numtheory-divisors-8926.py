# Task: gen-numtheory-divisors-8926 | Score: 100% | 2026-02-13T17:11:30.778066

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))