# Task: gen-dp-max_subarray-2091 | Score: 100% | 2026-02-10T18:16:27.134056

n = int(input())
arr = []
for _ in range(n):
    arr.append(int(input()))

max_so_far = arr[0]
current_max = arr[0]

for i in range(1, n):
    current_max = max(arr[i], current_max + arr[i])
    max_so_far = max(max_so_far, current_max)

print(max_so_far)