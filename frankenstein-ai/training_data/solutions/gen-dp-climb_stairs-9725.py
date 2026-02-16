# Task: gen-dp-climb_stairs-9725 | Score: 100% | 2026-02-10T18:10:58.230853

def solve():
    n = int(input())
    
    if n <= 0:
        print(0)
        return
    
    if n == 1:
        print(1)
        return
    
    if n == 2:
        print(2)
        return
    
    dp = [0] * (n + 1)
    dp[1] = 1
    dp[2] = 2
    
    for i in range(3, n + 1):
        dp[i] = dp[i-1] + dp[i-2]
        
    print(dp[n])

solve()