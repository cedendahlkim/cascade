# Task: gen-numtheory-divisors-8305 | Score: 100% | 2026-02-13T16:48:12.908418

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))