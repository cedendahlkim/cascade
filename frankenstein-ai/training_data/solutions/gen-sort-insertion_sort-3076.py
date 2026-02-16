# Task: gen-sort-insertion_sort-3076 | Score: 100% | 2026-02-12T15:40:56.708085

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