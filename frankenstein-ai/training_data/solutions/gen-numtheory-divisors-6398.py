# Task: gen-numtheory-divisors-6398 | Score: 100% | 2026-02-15T07:53:59.536834

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))