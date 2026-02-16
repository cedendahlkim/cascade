# Task: gen-dp-climb_stairs-6865 | Score: 100% | 2026-02-10T17:00:00.207446

n = int(input())

def climb_stairs(n):
  if n <= 1:
    return 1
  else:
    a = 1
    b = 1
    for _ in range(2, n + 1):
      temp = a + b
      a = b
      b = temp
    return b

print(climb_stairs(n))