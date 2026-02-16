# Task: gen-dp-climb_stairs-1807 | Score: 100% | 2026-02-11T11:00:38.079898

def solve():
    n = int(input())
    
    if n <= 1:
        print(1)
        return
    
    dp = [0] * (n + 1)
    dp[0] = 1
    dp[1] = 1
    
    for i in range(2, n + 1):
        dp[i] = dp[i-1] + dp[i-2]
    
    print(dp[n])

solve()