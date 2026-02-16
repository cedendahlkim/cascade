# Task: gen-dp-max_subarray-4011 | Score: 100% | 2026-02-10T18:37:34.843743

def max_subarray_sum(arr):
  max_so_far = 0
  current_max = 0
  for i in range(len(arr)):
    current_max += arr[i]
    if current_max > max_so_far:
      max_so_far = current_max
    if current_max < 0:
      current_max = 0
  if max_so_far == 0:
    max_so_far = max(arr)
    
  return max_so_far


n = int(input())
arr = []
for _ in range(n):
  arr.append(int(input()))

print(max_subarray_sum(arr))