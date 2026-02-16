# Task: gen-algo-remove_duplicates-6993 | Score: 100% | 2026-02-10T15:43:12.559401

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

unique_numbers = []
seen = set()

for num in numbers:
    if num not in seen:
        unique_numbers.append(num)
        seen.add(num)

print(*unique_numbers)