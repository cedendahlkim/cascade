# Task: gen-algo-running_sum-7947 | Score: 100% | 2026-02-10T15:41:54.647961

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