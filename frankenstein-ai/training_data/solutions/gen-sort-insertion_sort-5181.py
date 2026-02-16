# Task: gen-sort-insertion_sort-5181 | Score: 100% | 2026-02-12T19:47:06.831810

def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n-i-1):
            if arr[j] > arr[j+1]:
                arr[j], arr[j+1] = arr[j+1], arr[j]

N = int(input())
arr = []
for _ in range(N):
    arr.append(int(input()))

bubble_sort(arr)

print(*arr)