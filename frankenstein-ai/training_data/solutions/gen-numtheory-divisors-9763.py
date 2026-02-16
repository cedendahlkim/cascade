# Task: gen-numtheory-divisors-9763 | Score: 100% | 2026-02-12T18:51:21.681348

n = int(input())
divisors = []
for i in range(1, n + 1):
    if n % i == 0:
        divisors.append(i)
print(*divisors)