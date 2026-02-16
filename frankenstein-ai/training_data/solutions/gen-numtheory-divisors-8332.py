# Task: gen-numtheory-divisors-8332 | Score: 100% | 2026-02-13T11:09:04.630666

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))