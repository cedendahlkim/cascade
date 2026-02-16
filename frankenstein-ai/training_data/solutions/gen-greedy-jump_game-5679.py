# Task: gen-greedy-jump_game-5679 | Score: 100% | 2026-02-15T10:28:11.711177

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