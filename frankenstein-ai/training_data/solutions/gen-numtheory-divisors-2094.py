# Task: gen-numtheory-divisors-2094 | Score: 100% | 2026-02-12T17:28:02.005094

n = int(input())
divisors = []
for i in range(1, n + 1):
    if n % i == 0:
        divisors.append(i)
print(*divisors)