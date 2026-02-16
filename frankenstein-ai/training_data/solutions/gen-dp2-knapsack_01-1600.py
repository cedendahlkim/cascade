# Task: gen-dp2-knapsack_01-1600 | Score: 100% | 2026-02-11T19:56:40.524996

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
                dp[i][w] = max(value + dp[i-1][w-weight], dp[i-1][w])
            else:
                dp[i][w] = dp[i-1][w]

    print(dp[N][W])

solve()