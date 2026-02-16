# Task: gen-dp-max_subarray-9719 | Score: 100% | 2026-02-11T08:42:41.832771

def max_subarray_sum():
  n = int(input())
  nums = []
  for _ in range(n):
    nums.append(int(input()))

  max_so_far = float('-inf')
  current_max = 0

  for i in range(n):
    current_max += nums[i]
    if current_max > max_so_far:
      max_so_far = current_max
    if current_max < 0:
      current_max = 0

  if max_so_far == 0:
      max_so_far = max(nums)

  print(max_so_far)

max_subarray_sum()