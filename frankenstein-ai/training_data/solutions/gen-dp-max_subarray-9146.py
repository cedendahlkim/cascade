# Task: gen-dp-max_subarray-9146 | Score: 100% | 2026-02-11T09:20:52.492275

def max_subarray_sum():
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
        if all(x <= 0 for x in arr):
            print(0)
        else:
            max_val = float('-inf')
            for x in arr:
                if x > max_val:
                    max_val = x
            print(max_val if max_val > 0 else 0)
    else:
      print(max_so_far)

max_subarray_sum()