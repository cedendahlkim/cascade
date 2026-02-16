# Task: gen-algo-remove_duplicates-3884 | Score: 100% | 2026-02-12T12:12:02.877781

n = int(input())
numbers = []
unique_numbers = []

for _ in range(n):
    num = int(input())
    numbers.append(num)

for num in numbers:
    if num not in unique_numbers:
        unique_numbers.append(num)

print(*unique_numbers)