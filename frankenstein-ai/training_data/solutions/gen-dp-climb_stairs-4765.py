# Task: gen-dp-climb_stairs-4765 | Score: 100% | 2026-02-10T18:46:46.597487

def solve():
    n = int(input())
    
    if n <= 0:
        print(0)
        return
    
    if n == 1:
        print(1)
        return
    
    dp = [0] * (n + 1)
    dp[1] = 1
    dp[2] = 2
    
    for i in range(3, n + 1):
        dp[i] = dp[i-1] + dp[i-2]
    
    print(dp[n])

solve()