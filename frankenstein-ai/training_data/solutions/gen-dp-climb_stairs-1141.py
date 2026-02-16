# Task: gen-dp-climb_stairs-1141 | Score: 100% | 2026-02-10T17:12:57.851600

def solve():
    n = int(input())
    
    if n <= 0:
        print(0)
        return
    
    dp = [0] * (n + 1)
    dp[0] = 1
    dp[1] = 1
    
    for i in range(2, n + 1):
        dp[i] = dp[i-1] + dp[i-2]
    
    print(dp[n])

solve()