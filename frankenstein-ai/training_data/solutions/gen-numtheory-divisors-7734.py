# Task: gen-numtheory-divisors-7734 | Score: 100% | 2026-02-13T13:47:50.949949

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))