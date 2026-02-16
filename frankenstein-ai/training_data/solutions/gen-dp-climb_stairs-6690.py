# Task: gen-dp-climb_stairs-6690 | Score: 100% | 2026-02-11T11:05:21.717205

def solve():
  n = int(input())
  
  if n <= 2:
    print(n)
    return

  fib = [0] * (n + 1)
  fib[0] = 1
  fib[1] = 1

  for i in range(2, n + 1):
    fib[i] = fib[i-1] + fib[i-2]
  
  print(fib[n])

solve()