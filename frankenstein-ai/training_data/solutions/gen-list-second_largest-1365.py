# Task: gen-list-second_largest-1365 | Score: 100% | 2026-02-12T16:38:46.860373

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    
    nums = sorted(list(set(nums)), reverse=True)
    
    print(nums[1])

solve()