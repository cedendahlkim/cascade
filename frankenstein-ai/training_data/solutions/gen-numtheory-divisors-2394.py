# Task: gen-numtheory-divisors-2394 | Score: 100% | 2026-02-15T09:01:52.122161

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))