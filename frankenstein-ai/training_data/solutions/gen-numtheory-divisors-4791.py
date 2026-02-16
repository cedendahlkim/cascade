# Task: gen-numtheory-divisors-4791 | Score: 100% | 2026-02-15T12:30:21.824651

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))