# Task: gen-dp-max_subarray-3942 | Score: 100% | 2026-02-11T08:39:43.583224

def max_subarray_sum(arr):
  max_so_far = -float('inf')
  current_max = 0
  for x in arr:
    current_max += x
    if current_max > max_so_far:
      max_so_far = current_max
    if current_max < 0:
      current_max = 0
  
  if max_so_far == 0:
      return max(arr)
  
  return max_so_far

n = int(input())
arr = []
for _ in range(n):
  arr.append(int(input()))

print(max_subarray_sum(arr))