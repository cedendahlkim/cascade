# Task: gen-dp-climb_stairs-7407 | Score: 100% | 2026-02-10T17:10:28.237620

def solve():
  n = int(input())
  
  if n <= 2:
    if n == 0:
      print(0)
    elif n == 1:
      print(1)
    else:
      print(2)
    return

  dp = [0] * (n + 1)
  dp[0] = 1
  dp[1] = 1
  
  for i in range(2, n + 1):
    dp[i] = dp[i-1] + dp[i-2]
    
  print(dp[n])

solve()