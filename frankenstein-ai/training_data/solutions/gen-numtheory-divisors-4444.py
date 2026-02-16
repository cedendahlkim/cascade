# Task: gen-numtheory-divisors-4444 | Score: 100% | 2026-02-15T07:54:01.709155

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))