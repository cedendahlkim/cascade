# Task: gen-dp-climb_stairs-5236 | Score: 100% | 2026-02-11T09:01:52.797789

def solve():
    n = int(input())
    
    dp = [0] * (n + 1)
    
    dp[0] = 1
    if n >= 1:
        dp[1] = 1
    if n >= 2:
        dp[2] = 2
    
    for i in range(3, n + 1):
        dp[i] = dp[i-1] + dp[i-2]
        
    print(dp[n])

solve()