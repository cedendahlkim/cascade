# Task: gen-numtheory-divisors-8864 | Score: 100% | 2026-02-14T13:12:28.092754

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))