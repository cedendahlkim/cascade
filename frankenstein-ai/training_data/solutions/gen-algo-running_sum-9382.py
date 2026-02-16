# Task: gen-algo-running_sum-9382 | Score: 100% | 2026-02-12T14:02:49.364677

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

prefix_sum = []
current_sum = 0
for num in numbers:
    current_sum += num
    prefix_sum.append(current_sum)

print(*prefix_sum)