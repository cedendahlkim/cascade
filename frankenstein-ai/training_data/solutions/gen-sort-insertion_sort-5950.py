# Task: gen-sort-insertion_sort-5950 | Score: 100% | 2026-02-12T13:48:23.703382

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