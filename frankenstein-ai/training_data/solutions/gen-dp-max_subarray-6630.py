# Task: gen-dp-max_subarray-6630 | Score: 100% | 2026-02-10T17:49:41.708256

def kadane():
  n = int(input())
  arr = []
  for _ in range(n):
    arr.append(int(input()))

  max_so_far = float('-inf')
  current_max = 0

  for i in range(n):
    current_max += arr[i]

    if current_max > max_so_far:
      max_so_far = current_max

    if current_max < 0:
      current_max = 0

  if max_so_far == 0:
      max_so_far = max(arr)
      
  print(max_so_far)

kadane()