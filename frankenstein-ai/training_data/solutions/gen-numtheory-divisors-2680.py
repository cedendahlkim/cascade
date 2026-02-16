# Task: gen-numtheory-divisors-2680 | Score: 100% | 2026-02-13T13:47:52.158005

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))