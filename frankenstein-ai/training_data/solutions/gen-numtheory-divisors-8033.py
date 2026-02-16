# Task: gen-numtheory-divisors-8033 | Score: 100% | 2026-02-13T14:01:20.541770

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))