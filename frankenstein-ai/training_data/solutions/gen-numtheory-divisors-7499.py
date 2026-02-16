# Task: gen-numtheory-divisors-7499 | Score: 100% | 2026-02-12T14:31:44.759319

n = int(input())
divisors = []
for i in range(1, n + 1):
    if n % i == 0:
        divisors.append(i)

print(*divisors)