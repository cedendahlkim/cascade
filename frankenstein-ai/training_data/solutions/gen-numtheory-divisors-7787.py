# Task: gen-numtheory-divisors-7787 | Score: 100% | 2026-02-13T18:58:09.075896

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))