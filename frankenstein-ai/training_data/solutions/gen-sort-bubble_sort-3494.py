# Task: gen-sort-bubble_sort-3494 | Score: 100% | 2026-02-12T19:46:47.897449

def insertion_sort(arr):
    for i in range(1, len(arr)):
        key = arr[i]
        j = i - 1
        while j >= 0 and key < arr[j]:
            arr[j + 1] = arr[j]
            j -= 1
        arr[j + 1] = key

n = int(input())
arr = []
for _ in range(n):
    arr.append(int(input()))

insertion_sort(arr)
print(*arr)