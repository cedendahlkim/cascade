# Task: gen-numtheory-divisors-5070 | Score: 100% | 2026-02-13T16:06:53.057479

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))