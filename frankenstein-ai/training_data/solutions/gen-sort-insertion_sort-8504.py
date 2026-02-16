# Task: gen-sort-insertion_sort-8504 | Score: 100% | 2026-02-12T12:59:31.792585

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