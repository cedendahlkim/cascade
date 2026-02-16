# Task: gen-sort-bubble_sort-5097 | Score: 100% | 2026-02-12T15:41:05.007882

n = int(input())
arr = []
for _ in range(n):
  arr.append(int(input()))

for i in range(n):
  for j in range(0, n-i-1):
    if arr[j] > arr[j+1]:
      arr[j], arr[j+1] = arr[j+1], arr[j]

for i in range(n):
  print(arr[i], end=" ")