# Task: gen-numtheory-divisors-5170 | Score: 100% | 2026-02-15T09:02:08.640921

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))