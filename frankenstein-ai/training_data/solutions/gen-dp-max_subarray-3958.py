# Task: gen-dp-max_subarray-3958 | Score: 100% | 2026-02-11T09:25:33.109328

def kadane():
  n = int(input())
  arr = []
  for _ in range(n):
    arr.append(int(input()))

  max_so_far = 0
  current_max = 0

  for x in arr:
    current_max += x
    if current_max < 0:
      current_max = 0
    if max_so_far < current_max:
      max_so_far = current_max

  if max_so_far == 0:
    max_so_far = max(arr)

  print(max_so_far)

kadane()