# Task: gen-search-search_rotated-8825 | Score: 100% | 2026-02-12T13:36:03.131324

def search_rotated_sorted_array():
    n = int(input())
    arr = list(map(int, input().split()))
    target = int(input())

    left, right = 0, n - 1

    while left <= right:
        mid = (left + right) // 2

        if arr[mid] == target:
            return mid

        if arr[left] <= arr[mid]:
            if arr[left] <= target <= arr[mid]:
                right = mid - 1
            else:
                left = mid + 1
        else:
            if arr[mid] <= target <= arr[right]:
                left = mid + 1
            else:
                right = mid - 1

    return -1

print(search_rotated_sorted_array())