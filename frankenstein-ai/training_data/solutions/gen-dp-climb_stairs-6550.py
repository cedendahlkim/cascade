# Task: gen-dp-climb_stairs-6550 | Score: 100% | 2026-02-10T18:44:06.535247

def climb_stairs(n):
    if n <= 1:
        return 1
    
    dp = [0] * (n + 1)
    dp[0] = 1
    dp[1] = 1
    
    for i in range(2, n + 1):
        dp[i] = dp[i-1] + dp[i-2]
        
    return dp[n]

n = int(input())
print(climb_stairs(n))