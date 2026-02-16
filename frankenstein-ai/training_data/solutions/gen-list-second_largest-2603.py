# Task: gen-list-second_largest-2603 | Score: 100% | 2026-02-12T17:31:53.981070

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

unique_numbers = sorted(list(set(numbers)), reverse=True)

if len(unique_numbers) > 1:
    print(unique_numbers[1])
else:
    print(unique_numbers[0])