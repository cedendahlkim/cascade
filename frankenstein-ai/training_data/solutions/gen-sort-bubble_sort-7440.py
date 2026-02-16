# Task: gen-sort-bubble_sort-7440 | Score: 100% | 2026-02-12T15:14:52.886153

def bubble_sort():
    n = int(input())
    arr = []
    for _ in range(n):
        arr.append(int(input()))

    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]

    print(*arr)

bubble_sort()