# Task: gen-numtheory-divisors-1626 | Score: 100% | 2026-02-13T15:28:08.195249

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))