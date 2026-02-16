# Task: gen-numtheory-divisors-2445 | Score: 100% | 2026-02-12T20:52:34.711364

n = int(input())
divisors = []
for i in range(1, n + 1):
    if n % i == 0:
        divisors.append(i)
print(*divisors)