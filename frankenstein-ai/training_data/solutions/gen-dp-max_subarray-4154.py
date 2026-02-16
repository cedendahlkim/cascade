# Task: gen-dp-max_subarray-4154 | Score: 100% | 2026-02-11T08:58:18.243988

def max_subarray_sum():
  n = int(input())
  arr = []
  for _ in range(n):
    arr.append(int(input()))

  max_so_far = -float('inf')
  current_max = 0

  for i in range(n):
    current_max += arr[i]

    if current_max > max_so_far:
      max_so_far = current_max

    if current_max < 0:
      current_max = 0

  
  if max_so_far == -float('inf'):
    max_so_far = max(arr)
    if max_so_far < 0:
      max_so_far = max(arr)
      
  
  all_neg = True
  for num in arr:
    if num > 0:
        all_neg = False
        break
  if all_neg:
      max_so_far = max(arr)

  print(max_so_far)

max_subarray_sum()