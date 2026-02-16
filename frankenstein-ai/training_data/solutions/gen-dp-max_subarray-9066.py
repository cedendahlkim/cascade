# Task: gen-dp-max_subarray-9066 | Score: 100% | 2026-02-10T18:47:33.219609

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
      if max_so_far < 0 and 0 in arr:
          max_so_far = 0
      elif max_so_far < 0 and 0 not in arr:
          max_so_far = max(arr)
          if max_so_far < 0 and n > 0:
              max_so_far = max(arr)
          elif max_so_far < 0 and n == 0:
              max_so_far = 0

      elif max_so_far > 0:
          pass
  else:
      pass

  if max_so_far < 0 and len(arr) > 0:
      max_so_far = max(arr)
  elif len(arr) == 0:
      max_so_far = 0


  if all(x < 0 for x in arr) and len(arr) > 0:
      max_so_far = max(arr)

  if max_so_far < 0 and 0 in arr:
      max_so_far = 0

  if max_so_far == 0 and all(x <= 0 for x in arr) and len(arr) > 0:
      if 0 in arr:
        max_so_far = 0
      else:
        max_so_far = max(arr)
  print(max_so_far)

max_subarray_sum()