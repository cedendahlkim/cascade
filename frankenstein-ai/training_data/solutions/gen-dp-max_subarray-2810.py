# Task: gen-dp-max_subarray-2810 | Score: 100% | 2026-02-10T16:56:53.434693

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

max_so_far = numbers[0]
current_max = numbers[0]

for i in range(1, n):
    current_max = max(numbers[i], current_max + numbers[i])
    max_so_far = max(max_so_far, current_max)

print(max_so_far)