# Task: gen-dp-max_subarray-2704 | Score: 100% | 2026-02-11T10:22:14.723163

def kadane():
  n = int(input())
  a = []
  for _ in range(n):
    a.append(int(input()))

  max_so_far = -10**9
  current_max = 0

  for i in range(0, n):
    current_max += a[i]

    if (max_so_far < current_max):
      max_so_far = current_max

    if (current_max < 0):
      current_max = 0

  print(max_so_far)

kadane()