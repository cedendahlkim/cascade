# Task: gen-numtheory-divisors-5996 | Score: 100% | 2026-02-12T12:24:50.475152

n = int(input())
divisors = []
for i in range(1, n + 1):
    if n % i == 0:
        divisors.append(i)
print(*divisors)