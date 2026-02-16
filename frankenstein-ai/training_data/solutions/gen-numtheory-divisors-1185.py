# Task: gen-numtheory-divisors-1185 | Score: 100% | 2026-02-10T15:40:36.483194

n = int(input())
divisors = []
for i in range(1, n + 1):
    if n % i == 0:
        divisors.append(i)
print(*divisors)