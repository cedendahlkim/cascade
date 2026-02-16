# Task: gen-sw-max_sum_k-2877 | Score: 100% | 2026-02-13T18:58:27.104355

def solve():
    n, k = map(int, input().split())
    nums = list(map(int, input().split()))
    
    max_sum = float('-inf')
    current_sum = 0
    
    for i in range(k):
        current_sum += nums[i]
    
    max_sum = current_sum
    
    for i in range(k, n):
        current_sum += nums[i] - nums[i - k]
        max_sum = max(max_sum, current_sum)
        
    print(max_sum)

solve()