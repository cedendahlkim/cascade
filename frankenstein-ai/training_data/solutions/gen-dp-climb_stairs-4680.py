# Task: gen-dp-climb_stairs-4680 | Score: 100% | 2026-02-11T07:33:55.991235

def solve():
  n = int(input())
  
  if n <= 2:
    print(n)
    return

  dp = [0] * (n + 1)
  dp[1] = 1
  dp[2] = 2

  for i in range(3, n + 1):
    dp[i] = dp[i-1] + dp[i-2]

  print(dp[n])
  
solve()