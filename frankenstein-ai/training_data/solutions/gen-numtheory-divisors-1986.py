# Task: gen-numtheory-divisors-1986 | Score: 100% | 2026-02-13T21:27:58.602438

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))