# Task: gen-dp-max_subarray-8355 | Score: 100% | 2026-02-10T18:35:04.946947

def max_subarray_sum(arr):
    max_so_far = arr[0]
    current_max = arr[0]
    for i in range(1, len(arr)):
        current_max = max(arr[i], current_max + arr[i])
        max_so_far = max(max_so_far, current_max)
    return max_so_far

n = int(input())
arr = []
for _ in range(n):
    arr.append(int(input()))

print(max_subarray_sum(arr))