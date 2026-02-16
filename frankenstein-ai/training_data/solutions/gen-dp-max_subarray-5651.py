# Task: gen-dp-max_subarray-5651 | Score: 100% | 2026-02-11T09:15:27.684165

def kadane(arr):
    max_so_far = 0
    current_max = 0
    for x in arr:
        current_max += x
        if current_max < 0:
            current_max = 0
        if max_so_far < current_max:
            max_so_far = current_max
    
    if max_so_far == 0:
        return max(arr)
    
    return max_so_far

n = int(input())
arr = []
for _ in range(n):
    arr.append(int(input()))

print(kadane(arr))