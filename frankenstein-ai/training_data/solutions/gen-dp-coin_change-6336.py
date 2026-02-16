# Task: gen-dp-coin_change-6336 | Score: 100% | 2026-02-10T17:33:26.902421

def solve():
  amount = int(input())
  n = int(input())
  coins = []
  for _ in range(n):
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