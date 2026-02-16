# Task: gen-numtheory-divisors-5978 | Score: 100% | 2026-02-13T13:42:28.319546

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))