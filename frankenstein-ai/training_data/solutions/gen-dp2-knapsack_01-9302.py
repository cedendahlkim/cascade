# Task: gen-dp2-knapsack_01-9302 | Score: 100% | 2026-02-11T14:25:02.914618

def solve():
    W, N = map(int, input().split())
    items = []
    for _ in range(N):
        items.append(list(map(int, input().split())))
    
    dp = [[0 for _ in range(W + 1)] for _ in range(N + 1)]
    
    for i in range(1, N + 1):
        weight, value = items[i-1]
        for w in range(W + 1):
            if weight <= w:
                dp[i][w] = max(dp[i-1][w], dp[i-1][w - weight] + value)
            else:
                dp[i][w] = dp[i-1][w]
                
    print(dp[N][W])

solve()