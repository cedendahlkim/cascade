# Task: gen-numtheory-divisors-6922 | Score: 100% | 2026-02-14T13:11:14.554594

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))