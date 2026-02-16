# Task: gen-sort-bubble_sort-4645 | Score: 100% | 2026-02-12T12:49:09.396463

def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n-i-1):
            if arr[j] > arr[j+1]:
                arr[j], arr[j+1] = arr[j+1], arr[j]

n = int(input())
arr = []
for _ in range(n):
    arr.append(int(input()))

bubble_sort(arr)
print(*arr)