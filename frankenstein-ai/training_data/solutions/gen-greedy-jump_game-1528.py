# Task: gen-greedy-jump_game-1528 | Score: 100% | 2026-02-13T18:34:21.740780

def solve():
    nums = list(map(int, input().split()))
    n = len(nums)
    reachable = 0
    for i in range(n):
        if i > reachable:
            print("no")
            return
        reachable = max(reachable, i + nums[i])
    print("yes")

solve()