# Task: gen-numtheory-divisors-8787 | Score: 100% | 2026-02-13T11:27:25.930042

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))