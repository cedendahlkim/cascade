# Task: gen-dp-coin_change-6559 | Score: 100% | 2026-02-15T14:00:02.016817

amount = int(input())
n = int(input())
coins = [int(input()) for _ in range(n)]
dp = [float('inf')] * (amount + 1)
dp[0] = 0
for c in coins:
    for a in range(c, amount + 1):
        dp[a] = min(dp[a], dp[a - c] + 1)
print(dp[amount] if dp[amount] != float('inf') else -1)