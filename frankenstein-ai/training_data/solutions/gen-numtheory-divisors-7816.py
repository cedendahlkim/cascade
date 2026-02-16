# Task: gen-numtheory-divisors-7816 | Score: 100% | 2026-02-13T09:04:28.866503

n = int(input())
divisors = []
for i in range(1, n + 1):
    if n % i == 0:
        divisors.append(i)
print(*divisors)