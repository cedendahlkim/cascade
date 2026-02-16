# Task: gen-dp2-knapsack_01-6620 | Score: 100% | 2026-02-11T12:35:54.630566

def solve():
    W, N = map(int, input().split())
    items = []
    for _ in range(N):
        items.append(list(map(int, input().split())))

    dp = [0] * (W + 1)

    for weight, value in items:
        for w in range(W, weight - 1, -1):
            dp[w] = max(dp[w], dp[w - weight] + value)

    print(dp[W])

solve()