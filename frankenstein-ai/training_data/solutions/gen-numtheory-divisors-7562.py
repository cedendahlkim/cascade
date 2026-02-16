# Task: gen-numtheory-divisors-7562 | Score: 100% | 2026-02-13T18:34:00.105935

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))