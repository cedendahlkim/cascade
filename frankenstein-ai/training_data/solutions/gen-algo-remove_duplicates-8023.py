# Task: gen-algo-remove_duplicates-8023 | Score: 100% | 2026-02-12T13:27:11.270878

n = int(input())
unique_numbers = []
for _ in range(n):
    num = int(input())
    if num not in unique_numbers:
        unique_numbers.append(num)

print(*unique_numbers)