# Task: gen-numtheory-divisors-3445 | Score: 100% | 2026-02-15T10:09:47.721704

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))