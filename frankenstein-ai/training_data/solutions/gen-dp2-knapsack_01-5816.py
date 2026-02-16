# Task: gen-dp2-knapsack_01-5816 | Score: 100% | 2026-02-11T19:20:03.849164

def solve():
    W, N = map(int, input().split())
    items = []
    for _ in range(N):
        items.append(tuple(map(int, input().split())))

    dp = [[0] * (W + 1) for _ in range(N + 1)]

    for i in range(1, N + 1):
        weight, value = items[i-1]
        for w in range(W + 1):
            if weight <= w:
                dp[i][w] = max(dp[i-1][w], dp[i-1][w-weight] + value)
            else:
                dp[i][w] = dp[i-1][w]

    print(dp[N][W])

solve()