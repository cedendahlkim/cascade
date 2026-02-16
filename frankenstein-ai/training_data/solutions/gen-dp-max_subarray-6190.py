# Task: gen-dp-max_subarray-6190 | Score: 100% | 2026-02-11T10:39:47.061218

def max_subarray_sum():
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

  print(max_so_far)

max_subarray_sum()