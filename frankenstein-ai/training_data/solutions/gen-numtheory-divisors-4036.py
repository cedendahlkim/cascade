# Task: gen-numtheory-divisors-4036 | Score: 100% | 2026-02-12T20:53:34.927584

n = int(input())
divisors = []
for i in range(1, int(n**0.5) + 1):
    if n % i == 0:
        divisors.append(i)
        if i != n // i:
            divisors.append(n // i)
divisors.sort()
print(*divisors)