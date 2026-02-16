# Task: 4.3 | Score: 100% | 2026-02-13T18:31:34.308830

def binary_search(arr, target):
    low = 0
    high = len(arr) - 1
    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1

n = int(input())
arr = []
for _ in range(n):
    arr.append(int(input()))
target = int(input())
print(binary_search(arr, target))