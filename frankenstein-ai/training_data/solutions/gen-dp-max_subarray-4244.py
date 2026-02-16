# Task: gen-dp-max_subarray-4244 | Score: 100% | 2026-02-11T09:14:11.058021

def max_subarray_sum(arr):
    max_so_far = 0
    current_max = 0
    start_index = 0
    end_index = 0
    j = 0

    for i in range(len(arr)):
        current_max += arr[i]

        if current_max > max_so_far:
            max_so_far = current_max
            start_index = j
            end_index = i

        if current_max < 0:
            current_max = 0
            j = i + 1

    if max_so_far == 0:
        max_so_far = max(arr)
    
    return max_so_far

n = int(input())
arr = []
for _ in range(n):
    arr.append(int(input()))

print(max_subarray_sum(arr))