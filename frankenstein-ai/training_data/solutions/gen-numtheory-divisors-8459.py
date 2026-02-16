# Task: gen-numtheory-divisors-8459 | Score: 100% | 2026-02-12T17:29:22.640952

n = int(input())
divisors = []
for i in range(1, int(n**0.5) + 1):
    if n % i == 0:
        divisors.append(i)
        if i != n // i:
            divisors.append(n // i)
divisors.sort()
print(*divisors)