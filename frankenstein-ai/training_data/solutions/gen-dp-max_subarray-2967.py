# Task: gen-dp-max_subarray-2967 | Score: 100% | 2026-02-10T19:09:05.114801

def max_subarray_sum(arr):
  """
  Finds the maximum sum of a contiguous subarray in a given array.

  Args:
    arr: A list of integers.

  Returns:
    The maximum sum of a contiguous subarray.
  """
  max_so_far = 0
  current_max = 0
  for x in arr:
    current_max += x
    if current_max < 0:
      current_max = 0
    if max_so_far < current_max:
      max_so_far = current_max
  if max_so_far == 0:
    return max(arr)
  return max_so_far


if __name__ == "__main__":
  n = int(input())
  arr = []
  for _ in range(n):
    arr.append(int(input()))

  print(max_subarray_sum(arr))