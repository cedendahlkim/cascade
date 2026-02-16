# Task: gen-numtheory-divisors-4987 | Score: 100% | 2026-02-13T20:32:58.176324

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))