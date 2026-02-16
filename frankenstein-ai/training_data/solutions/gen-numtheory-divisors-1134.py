# Task: gen-numtheory-divisors-1134 | Score: 100% | 2026-02-13T17:36:10.093116

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))