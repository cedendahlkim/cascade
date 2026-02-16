# Task: gen-dp2-knapsack_01-2859 | Score: 100% | 2026-02-12T07:39:41.441325

def solve():
    W, N = map(int, input().split())
    items = []
    for _ in range(N):
        items.append(tuple(map(int, input().split())))

    dp = [[0 for _ in range(W + 1)] for _ in range(N + 1)]

    for i in range(1, N + 1):
        weight, value = items[i-1]
        for w in range(1, W + 1):
            if weight <= w:
                dp[i][w] = max(value + dp[i-1][w-weight], dp[i-1][w])
            else:
                dp[i][w] = dp[i-1][w]

    print(dp[N][W])

solve()