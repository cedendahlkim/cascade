# Task: gen-dp-coin_change-1912 | Score: 100% | 2026-02-10T17:10:13.623668

def solve():
    amount = int(input())
    num_coins = int(input())
    coin_values = []
    for _ in range(num_coins):
        coin_values.append(int(input()))

    dp = [float('inf')] * (amount + 1)
    dp[0] = 0

    for coin in coin_values:
        for i in range(coin, amount + 1):
            dp[i] = min(dp[i], dp[i - coin] + 1)

    if dp[amount] == float('inf'):
        print("-1")
    else:
        print(dp[amount])

solve()