# Task: gen-dp-max_subarray-4512 | Score: 100% | 2026-02-11T10:16:31.117662

n = int(input())
max_so_far = float('-inf')
current_max = 0

for _ in range(n):
    x = int(input())
    current_max += x
    if current_max > max_so_far:
        max_so_far = current_max
    if current_max < 0:
        current_max = 0

print(max_so_far)