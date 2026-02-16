# Task: gen-greedy-jump_game-1203 | Score: 100% | 2026-02-14T13:11:49.566675

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