# Task: gen-dp2-knapsack_01-4222 | Score: 100% | 2026-02-12T16:59:25.289734

def solve():
    W, N = map(int, input().split())
    
    if W == 0:
        print(0)
        return
    
    wt = []
    val = []
    for _ in range(N):
        w, v = map(int, input().split())
        wt.append(w)
        val.append(v)
    
    dp = [[0] * (W + 1) for _ in range(N + 1)]
    
    for i in range(1, N + 1):
        for w in range(W + 1):
            dp[i][w] = dp[i-1][w]
            if wt[i-1] <= w:
                dp[i][w] = max(dp[i][w], dp[i-1][w-wt[i-1]] + val[i-1])
    
    print(dp[N][W])

solve()