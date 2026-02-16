# Task: gen-dp-max_subarray-6125 | Score: 100% | 2026-02-11T08:59:32.170715

def max_subarray_sum(arr):
    max_so_far = float('-inf')
    current_max = 0
    for i in range(len(arr)):
        current_max += arr[i]
        if current_max > max_so_far:
            max_so_far = current_max
        if current_max < 0:
            current_max = 0
    
    if max_so_far == float('-inf'):
        return max(arr)
    
    return max_so_far

n = int(input())
arr = []
for _ in range(n):
    arr.append(int(input()))

print(max_subarray_sum(arr))