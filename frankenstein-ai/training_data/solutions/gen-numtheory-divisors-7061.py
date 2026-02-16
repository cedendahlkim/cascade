# Task: gen-numtheory-divisors-7061 | Score: 100% | 2026-02-15T07:52:36.242327

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))