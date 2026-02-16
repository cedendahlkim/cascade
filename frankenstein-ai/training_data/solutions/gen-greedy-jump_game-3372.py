# Task: gen-greedy-jump_game-3372 | Score: 100% | 2026-02-13T21:48:30.387078

def solve():
    nums = list(map(int, input().split()))
    n = len(nums)
    
    reachable = 0
    for i in range(n):
        if i > reachable:
            print("no")
            return
        reachable = max(reachable, i + nums[i])
        if reachable >= n - 1:
            print("yes")
            return
    
    print("yes")

solve()