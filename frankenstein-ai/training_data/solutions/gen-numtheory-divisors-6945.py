# Task: gen-numtheory-divisors-6945 | Score: 100% | 2026-02-13T11:35:18.789181

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))