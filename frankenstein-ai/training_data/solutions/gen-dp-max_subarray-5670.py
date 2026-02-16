# Task: gen-dp-max_subarray-5670 | Score: 100% | 2026-02-11T07:31:06.483043

def max_subarray_sum(arr):
    max_so_far = float('-inf')
    current_max = 0
    for x in arr:
        current_max += x
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