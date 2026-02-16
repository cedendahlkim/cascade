# Task: gen-numtheory-divisors-9677 | Score: 100% | 2026-02-13T18:29:39.357534

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))