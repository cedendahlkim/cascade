# Task: gen-dp-climb_stairs-8679 | Score: 100% | 2026-02-11T12:02:07.689863

def climb_stairs(n):
  if n <= 1:
    return 1
  a, b = 1, 1
  for _ in range(2, n + 1):
    a, b = b, a + b
  return b

n = int(input())
print(climb_stairs(n))