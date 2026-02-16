# Task: gen-sw-max_sum_k-8755 | Score: 100% | 2026-02-15T08:35:46.481845

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