# Task: gen-numtheory-divisors-5188 | Score: 100% | 2026-02-12T13:22:47.831365

n = int(input())
divisors = []
for i in range(1, int(n**0.5) + 1):
    if n % i == 0:
        divisors.append(i)
        if i != n // i:
            divisors.append(n // i)
divisors.sort()
print(*divisors)