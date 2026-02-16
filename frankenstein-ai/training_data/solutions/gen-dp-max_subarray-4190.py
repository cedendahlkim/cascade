# Task: gen-dp-max_subarray-4190 | Score: 100% | 2026-02-11T10:50:40.389183

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

max_so_far = float('-inf')
current_max = 0

for num in nums:
    current_max += num
    if current_max > max_so_far:
        max_so_far = current_max
    if current_max < 0:
        current_max = 0

print(max_so_far)