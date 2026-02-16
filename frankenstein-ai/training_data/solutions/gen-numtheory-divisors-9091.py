# Task: gen-numtheory-divisors-9091 | Score: 100% | 2026-02-13T14:01:32.758062

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))