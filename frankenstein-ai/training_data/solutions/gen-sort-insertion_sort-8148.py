# Task: gen-sort-insertion_sort-8148 | Score: 100% | 2026-02-12T11:59:52.652146

n = int(input())
arr = []
for _ in range(n):
  arr.append(int(input()))

for i in range(1, len(arr)):
  key = arr[i]
  j = i - 1
  while j >= 0 and key < arr[j]:
    arr[j + 1] = arr[j]
    j -= 1
  arr[j + 1] = key

print(*arr)