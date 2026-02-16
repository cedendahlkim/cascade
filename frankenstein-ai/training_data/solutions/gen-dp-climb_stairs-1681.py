# Task: gen-dp-climb_stairs-1681 | Score: 100% | 2026-02-10T18:00:02.142092

def solve():
    n = int(input())
    
    if n <= 2:
        print(n)
        return
    
    dp = [0] * (n + 1)
    dp[1] = 1
    dp[2] = 2
    
    for i in range(3, n + 1):
        dp[i] = dp[i-1] + dp[i-2]
        
    print(dp[n])

solve()