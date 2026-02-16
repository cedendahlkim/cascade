# Task: gen-dp-max_subarray-5511 | Score: 100% | 2026-02-10T18:34:45.303885

def kadane():
  n = int(input())
  a = []
  for _ in range(n):
    a.append(int(input()))

  max_so_far = -100000000
  current_max = 0

  for i in range(n):
    current_max += a[i]

    if (max_so_far < current_max):
      max_so_far = current_max

    if current_max < 0:
      current_max = 0
  
  if max_so_far == 0:
      max_so_far = max(a)
  

  print(max_so_far)

kadane()