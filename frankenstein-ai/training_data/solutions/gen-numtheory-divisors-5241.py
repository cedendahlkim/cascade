# Task: gen-numtheory-divisors-5241 | Score: 100% | 2026-02-12T12:41:24.841707

n = int(input())
divisors = []
for i in range(1, n + 1):
    if n % i == 0:
        divisors.append(i)
print(*divisors)