# Task: gen-numtheory-divisors-7824 | Score: 100% | 2026-02-13T14:18:56.055849

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))