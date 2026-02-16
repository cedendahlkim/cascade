# Task: gen-numtheory-divisors-8729 | Score: 100% | 2026-02-13T13:42:05.179899

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))