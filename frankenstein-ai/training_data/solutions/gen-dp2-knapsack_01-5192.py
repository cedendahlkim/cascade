# Task: gen-dp2-knapsack_01-5192 | Score: 100% | 2026-02-12T07:31:08.255987

def solve():
    W, N = map(int, input().split())
    items = []
    for _ in range(N):
        items.append(list(map(int, input().split())))

    dp = [0] * (W + 1)

    for weight, value in items:
        for capacity in range(W, weight - 1, -1):
            dp[capacity] = max(dp[capacity], dp[capacity - weight] + value)

    print(dp[W])

solve()