# Task: gen-dp-climb_stairs-7740 | Score: 100% | 2026-02-10T18:02:36.443701

def solve():
    n = int(input())
    
    dp = [0] * (n + 1)
    dp[0] = 1
    
    if n >= 1:
        dp[1] = 1
    
    for i in range(2, n + 1):
        dp[i] = dp[i-1] + dp[i-2]
    
    print(dp[n])

solve()