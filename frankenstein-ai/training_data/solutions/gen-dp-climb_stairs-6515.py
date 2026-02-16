# Task: gen-dp-climb_stairs-6515 | Score: 100% | 2026-02-10T18:42:21.430863

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