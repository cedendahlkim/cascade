# Task: gen-sort-bubble_sort-8371 | Score: 100% | 2026-02-12T19:58:45.455637

def insertion_sort(arr):
    for i in range(1, len(arr)):
        key = arr[i]
        j = i - 1
        while j >= 0 and arr[j] > key:
            arr[j + 1] = arr[j]
            j -= 1
        arr[j + 1] = key

n = int(input())
arr = []
for _ in range(n):
    arr.append(int(input()))

insertion_sort(arr)
print(*arr)