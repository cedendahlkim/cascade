# Task: gen-dp2-knapsack_01-3472 | Score: 100% | 2026-02-13T18:37:51.073167

line = input().split()
W, N = int(line[0]), int(line[1])
items = [tuple(map(int, input().split())) for _ in range(N)]
dp = [[0]*(W+1) for _ in range(N+1)]
for i in range(1, N+1):
    w, v = items[i-1]
    for c in range(W+1):
        dp[i][c] = dp[i-1][c]
        if w <= c:
            dp[i][c] = max(dp[i][c], dp[i-1][c-w] + v)
print(dp[N][W])