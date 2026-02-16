# Task: gen-dp-climb_stairs-5759 | Score: 100% | 2026-02-10T17:32:05.638890

n = int(input())
a = 1
b = 1
for i in range(n):
  temp = a
  a = a + b
  b = temp
print(b)