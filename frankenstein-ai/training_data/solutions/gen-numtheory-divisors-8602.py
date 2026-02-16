# Task: gen-numtheory-divisors-8602 | Score: 100% | 2026-02-13T21:27:58.963614

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))