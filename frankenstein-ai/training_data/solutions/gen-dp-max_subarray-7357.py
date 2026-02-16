# Task: gen-dp-max_subarray-7357 | Score: 100% | 2026-02-11T09:17:09.886715

def max_subarray_sum(arr):
    max_so_far = 0
    current_max = 0
    for x in arr:
        current_max += x
        if current_max < 0:
            current_max = 0
        if max_so_far < current_max:
            max_so_far = current_max
    
    if max_so_far == 0:
      max_so_far = max(arr)

    return max_so_far

n = int(input())
arr = []
for _ in range(n):
    arr.append(int(input()))

print(max_subarray_sum(arr))