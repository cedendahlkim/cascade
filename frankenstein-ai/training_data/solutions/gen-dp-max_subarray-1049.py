# Task: gen-dp-max_subarray-1049 | Score: 100% | 2026-02-11T09:16:29.763360

def kadane():
    n = int(input())
    a = []
    for _ in range(n):
        a.append(int(input()))
    
    max_so_far = -float('inf')
    current_max = 0
    
    for i in range(n):
        current_max += a[i]
        
        if current_max > max_so_far:
            max_so_far = current_max
            
        if current_max < 0:
            current_max = 0
            
    print(max_so_far)
    
kadane()