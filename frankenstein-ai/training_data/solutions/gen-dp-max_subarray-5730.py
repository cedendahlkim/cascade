# Task: gen-dp-max_subarray-5730 | Score: 100% | 2026-02-11T09:47:10.895153

def kadane():
  n = int(input())
  a = []
  for _ in range(n):
    a.append(int(input()))

  max_so_far = 0
  current_max = 0

  for i in range(n):
    current_max += a[i]

    if current_max < 0:
      current_max = 0

    if max_so_far < current_max:
      max_so_far = current_max
  
  if max_so_far == 0:
    max_so_far = max(a)

  print(max_so_far)

kadane()