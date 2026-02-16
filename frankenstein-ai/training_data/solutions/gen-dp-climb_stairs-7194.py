# Task: gen-dp-climb_stairs-7194 | Score: 100% | 2026-02-11T09:32:14.165225

def climb_stairs(n):
  """
  Calculates the number of unique ways to climb n stairs,
  taking 1 or 2 steps at a time.

  Args:
    n: The number of stairs.

  Returns:
    The number of unique ways to climb the stairs.
  """
  if n <= 2:
    return n
  
  dp = [0] * (n + 1)
  dp[1] = 1
  dp[2] = 2

  for i in range(3, n + 1):
    dp[i] = dp[i - 1] + dp[i - 2]

  return dp[n]

if __name__ == "__main__":
  n = int(input())
  result = climb_stairs(n)
  print(result)