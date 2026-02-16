# Task: gen-numtheory-divisors-6698 | Score: 100% | 2026-02-15T07:52:36.618989

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))