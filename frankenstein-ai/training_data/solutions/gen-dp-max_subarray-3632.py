# Task: gen-dp-max_subarray-3632 | Score: 100% | 2026-02-10T17:43:08.970296

def solve():
    n = int(input())
    nums = [int(input()) for _ in range(n)]
    
    max_so_far = float('-inf')
    current_max = 0
    
    for num in nums:
        current_max += num
        if current_max > max_so_far:
            max_so_far = current_max
        if current_max < 0:
            current_max = 0
            
    print(max_so_far)

solve()