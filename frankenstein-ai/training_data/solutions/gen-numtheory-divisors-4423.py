# Task: gen-numtheory-divisors-4423 | Score: 100% | 2026-02-13T12:23:18.152908

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))