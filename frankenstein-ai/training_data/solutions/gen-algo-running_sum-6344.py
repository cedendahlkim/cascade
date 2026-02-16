# Task: gen-algo-running_sum-6344 | Score: 100% | 2026-02-12T12:16:43.753643

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

prefix_sum = []
current_sum = 0
for number in numbers:
    current_sum += number
    prefix_sum.append(current_sum)

print(*prefix_sum)