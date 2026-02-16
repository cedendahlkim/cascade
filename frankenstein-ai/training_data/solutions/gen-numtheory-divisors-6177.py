# Task: gen-numtheory-divisors-6177 | Score: 100% | 2026-02-14T12:20:51.982356

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))