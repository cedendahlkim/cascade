# Task: gen-numtheory-divisors-1084 | Score: 100% | 2026-02-14T13:11:15.159648

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))