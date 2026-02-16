# Task: gen-dp-climb_stairs-1183 | Score: 100% | 2026-02-11T08:54:46.265767

def solve():
    n = int(input())
    
    if n <= 2:
        if n == 0:
            print(1)
        elif n == 1:
            print(1)
        else:
            print(2)
        return

    dp = [0] * (n + 1)
    dp[0] = 1
    dp[1] = 1
    dp[2] = 2
    
    for i in range(3, n + 1):
        dp[i] = dp[i-1] + dp[i-2]
    
    print(dp[n])

solve()