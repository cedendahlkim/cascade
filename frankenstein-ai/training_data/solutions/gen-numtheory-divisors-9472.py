# Task: gen-numtheory-divisors-9472 | Score: 100% | 2026-02-15T09:02:39.485800

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))