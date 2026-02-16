# Task: gen-numtheory-divisors-6508 | Score: 100% | 2026-02-12T14:32:16.706447

n = int(input())
divisors = []
for i in range(1, n + 1):
    if n % i == 0:
        divisors.append(i)
print(*divisors)