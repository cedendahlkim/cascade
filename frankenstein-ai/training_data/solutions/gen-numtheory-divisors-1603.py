# Task: gen-numtheory-divisors-1603 | Score: 100% | 2026-02-14T12:02:58.924938

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))