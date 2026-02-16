# Task: gen-ll-remove_nth-1668 | Score: 100% | 2026-02-11T12:09:09.941547

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    
    k = int(input())
    
    result = []
    for i in range(n):
        if i != k:
            result.append(nums[i])
            
    print(*result)

solve()