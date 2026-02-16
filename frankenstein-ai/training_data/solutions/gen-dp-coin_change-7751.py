# Task: gen-dp-coin_change-7751 | Score: 100% | 2026-02-11T11:22:25.138053

def solve():
    amount = int(input())
    num_coins = int(input())
    coins = []
    for _ in range(num_coins):
        coins.append(int(input()))

    if amount == 0:
        print(0)
        return

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