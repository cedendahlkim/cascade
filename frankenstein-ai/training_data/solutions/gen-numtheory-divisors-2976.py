# Task: gen-numtheory-divisors-2976 | Score: 100% | 2026-02-13T14:42:37.571548

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))