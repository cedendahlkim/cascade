# Task: gen-numtheory-divisors-3228 | Score: 100% | 2026-02-13T17:11:31.108272

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))