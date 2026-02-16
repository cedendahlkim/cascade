# Task: gen-numtheory-divisors-6155 | Score: 100% | 2026-02-13T18:39:57.279509

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))