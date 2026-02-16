# Task: gen-dp-climb_stairs-7311 | Score: 100% | 2026-02-10T17:02:52.258855

n = int(input())
a = [0] * (n + 1)
a[0] = 1
a[1] = 1
for i in range(2, n + 1):
  a[i] = a[i - 1] + a[i - 2]
print(a[n])