# Task: gen-numtheory-divisors-9008 | Score: 100% | 2026-02-13T12:25:55.829864

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))