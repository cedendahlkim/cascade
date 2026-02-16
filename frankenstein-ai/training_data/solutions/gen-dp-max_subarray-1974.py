# Task: gen-dp-max_subarray-1974 | Score: 100% | 2026-02-10T19:01:19.832461

def kadane(arr):
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

print(kadane(arr))