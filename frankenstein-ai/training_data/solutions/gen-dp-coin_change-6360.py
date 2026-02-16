# Task: gen-dp-coin_change-6360 | Score: 100% | 2026-02-13T09:26:08.740842

amount = int(input())
n = int(input())
coins = [int(input()) for _ in range(n)]
dp = [float('inf')] * (amount + 1)
dp[0] = 0
for c in coins:
    for a in range(c, amount + 1):
        dp[a] = min(dp[a], dp[a - c] + 1)
print(dp[amount] if dp[amount] != float('inf') else -1)