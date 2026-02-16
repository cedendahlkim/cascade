# Task: gen-numtheory-divisors-9715 | Score: 100% | 2026-02-13T16:07:07.849627

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))