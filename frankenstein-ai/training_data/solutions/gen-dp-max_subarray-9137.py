# Task: gen-dp-max_subarray-9137 | Score: 100% | 2026-02-10T18:58:06.582909

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
        max_so_far = max(arr)
        if max_so_far < 0:
            max_so_far = 0

    if all(x < 0 for x in arr):
      max_so_far = max(arr)
      if max_so_far < 0:
        pass
      else:
        max_so_far = max(arr) if len(arr) > 0 else 0
    
    if max_so_far == 0 and any(x > 0 for x in arr):
      temp_max = 0
      for i in range(n):
          temp_max += arr[i]

          if temp_max < 0:
              temp_max = 0

          if max_so_far < temp_max:
              max_so_far = temp_max
    
    if max_so_far == 0 and all(x <= 0 for x in arr):
      max_so_far = max(arr)
      if max_so_far < 0:
        pass
    
    if n==1 and arr[0] > 0:
      max_so_far = arr[0]

    current_max = 0
    max_so_far = float('-inf')
    for i in range(n):
      current_max = max(arr[i], current_max + arr[i])
      max_so_far = max(max_so_far, current_max)
    print(max_so_far)

max_subarray_sum()