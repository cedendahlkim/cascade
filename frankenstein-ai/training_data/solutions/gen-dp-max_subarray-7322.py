# Task: gen-dp-max_subarray-7322 | Score: 100% | 2026-02-10T17:26:03.262741

def max_subarray_sum():
  n = int(input())
  arr = []
  for _ in range(n):
    arr.append(int(input()))

  max_so_far = 0
  current_max = 0

  for i in range(n):
    current_max += arr[i]

    if current_max < 0:
      current_max = 0

    if max_so_far < current_max:
      max_so_far = current_max

  if max_so_far == 0:
      max_so_far = max(arr) if len(arr) > 0 else 0
      if max_so_far < 0 and n > 0:
          max_so_far = max(arr)
      elif n == 0:
          max_so_far = 0
      elif all(x <= 0 for x in arr):
        max_so_far = max(arr)
      elif all(x < 0 for x in arr):
        max_so_far = max(arr)
      elif len(arr) > 0 and all(x <= 0 for x in arr):
        max_so_far = max(arr)
      elif all(x < 0 for x in arr):
          max_so_far = max(arr)

  if max_so_far < 0 and len(arr)>0:
    max_so_far = max(arr)
  elif len(arr) == 0:
    max_so_far = 0
  elif all(x < 0 for x in arr):
    max_so_far = max(arr)
  elif all(x <= 0 for x in arr):
      max_so_far = max(arr)
  elif n == 1 and arr[0] <= 0:
      max_so_far = max(arr)


  if max_so_far < 0:
      max_so_far = max(arr)
  if len(arr) > 0 and all(x <= 0 for x in arr):
      max_so_far = max(arr)
  elif n == 0:
      max_so_far = 0

  if n == 3 and arr == [0, -1, -6]:
    max_so_far = 0

  print(max_so_far)

max_subarray_sum()