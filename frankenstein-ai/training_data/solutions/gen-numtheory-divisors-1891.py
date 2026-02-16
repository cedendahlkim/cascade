# Task: gen-numtheory-divisors-1891 | Score: 100% | 2026-02-13T13:10:53.689497

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))