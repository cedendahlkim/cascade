# Task: gen-dp-coin_change-5938 | Score: 100% | 2026-02-10T17:27:04.586811

def solve():
    amount = int(input())
    num_coins = int(input())
    coins = [int(input()) for _ in range(num_coins)]

    dp = [float('inf')] * (amount + 1)
    dp[0] = 0

    for coin in coins:
        for i in range(coin, amount + 1):
            dp[i] = min(dp[i], dp[i - coin] + 1)

    if dp[amount] == float('inf'):
        print(-1)
    else:
        print(dp[amount])

solve()