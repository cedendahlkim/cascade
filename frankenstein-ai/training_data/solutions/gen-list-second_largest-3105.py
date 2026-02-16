# Task: gen-list-second_largest-3105 | Score: 100% | 2026-02-12T17:29:51.671818

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

unique_numbers = sorted(list(set(numbers)), reverse=True)

if len(unique_numbers) > 1:
    print(unique_numbers[1])