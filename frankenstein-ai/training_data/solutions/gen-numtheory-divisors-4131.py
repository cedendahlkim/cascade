# Task: gen-numtheory-divisors-4131 | Score: 100% | 2026-02-13T09:34:11.778648

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))