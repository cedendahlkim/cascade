# Task: gen-dp-max_subarray-9464 | Score: 100% | 2026-02-11T08:47:50.750300

def max_subarray_sum(arr):
    max_so_far = float('-inf')
    current_max = 0
    for i in range(len(arr)):
        current_max += arr[i]
        if current_max > max_so_far:
            max_so_far = current_max
        if current_max < 0:
            current_max = 0
    return max_so_far

n = int(input())
arr = []
for _ in range(n):
    arr.append(int(input()))

print(max_subarray_sum(arr))