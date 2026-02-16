# Task: gen-sort-insertion_sort-4244 | Score: 100% | 2026-02-12T12:16:59.308639

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