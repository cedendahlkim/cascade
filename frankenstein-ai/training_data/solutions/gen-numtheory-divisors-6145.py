# Task: gen-numtheory-divisors-6145 | Score: 100% | 2026-02-13T11:53:57.841128

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))