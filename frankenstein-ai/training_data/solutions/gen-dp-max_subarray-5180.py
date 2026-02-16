# Task: gen-dp-max_subarray-5180 | Score: 100% | 2026-02-11T10:42:12.846294

def max_subarray_kadane():
    n = int(input())
    arr = []
    for _ in range(n):
        arr.append(int(input()))
    
    max_so_far = 0
    current_max = 0
    
    for i in range(n):
        current_max += arr[i]
        if current_max < 0:
            current_max = 0
        if max_so_far < current_max:
            max_so_far = current_max
            
    
    if max_so_far == 0:
        max_val = float('-inf')
        for num in arr:
            if num > max_val:
                max_val = num
        if max_val < 0:
            print(0)
        else:
          print(0)
    else:
        print(max_so_far)

max_subarray_kadane()