# Task: gen-algo-remove_duplicates-6354 | Score: 100% | 2026-02-12T12:16:22.921038

n = int(input())
unique_numbers = []
seen = set()

for _ in range(n):
    num = int(input())
    if num not in seen:
        unique_numbers.append(num)
        seen.add(num)

print(*unique_numbers)