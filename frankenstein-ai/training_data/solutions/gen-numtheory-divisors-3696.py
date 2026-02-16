# Task: gen-numtheory-divisors-3696 | Score: 100% | 2026-02-15T07:53:50.500856

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))