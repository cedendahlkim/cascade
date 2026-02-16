# Task: gen-dp-climb_stairs-1951 | Score: 100% | 2026-02-11T07:28:01.389938

def climb_stairs(n):
    if n <= 2:
        return n
    dp = [0] * (n + 1)
    dp[1] = 1
    dp[2] = 2
    for i in range(3, n + 1):
        dp[i] = dp[i - 1] + dp[i - 2]
    return dp[n]

n = int(input())
print(climb_stairs(n))