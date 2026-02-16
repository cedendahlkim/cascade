# Task: gen-numtheory-divisors-7387 | Score: 100% | 2026-02-14T12:09:02.791449

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))