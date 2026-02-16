# Task: gen-numtheory-divisors-8869 | Score: 100% | 2026-02-12T12:18:04.608479

n = int(input())
divisors = []
for i in range(1, n + 1):
    if n % i == 0:
        divisors.append(i)
print(*divisors)