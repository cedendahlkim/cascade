# Task: gen-dp-longest_increasing-2374 | Score: 100% | 2026-02-11T07:41:31.675915

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))

    dp = []
    for i in range(n):
        dp.append(1)
        for j in range(i):
            if nums[i] > nums[j]:
                dp[i] = max(dp[i], dp[j] + 1)
    
    if not dp:
        print(0)
    else:
        print(max(dp))

solve()