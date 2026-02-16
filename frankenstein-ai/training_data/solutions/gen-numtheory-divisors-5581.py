# Task: gen-numtheory-divisors-5581 | Score: 100% | 2026-02-13T11:27:23.057259

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))