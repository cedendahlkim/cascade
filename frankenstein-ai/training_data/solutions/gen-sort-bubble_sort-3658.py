# Task: gen-sort-bubble_sort-3658 | Score: 100% | 2026-02-12T13:48:10.458108

n = int(input())
arr = []
for _ in range(n):
    arr.append(int(input()))

for i in range(n):
    for j in range(0, n - i - 1):
        if arr[j] > arr[j + 1]:
            arr[j], arr[j + 1] = arr[j + 1], arr[j]

print(*arr)