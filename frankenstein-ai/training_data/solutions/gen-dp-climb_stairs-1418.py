# Task: gen-dp-climb_stairs-1418 | Score: 100% | 2026-02-10T17:25:18.941279

n = int(input())
a = 1
b = 1
for i in range(n):
  temp = a
  a = a + b
  b = temp
print(b)