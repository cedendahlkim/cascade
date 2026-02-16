# Task: gen-search-search_rotated-9979 | Score: 100% | 2026-02-12T17:45:06.333861

def search_rotated_sorted_array():
    n = int(input())
    arr = list(map(int, input().split()))
    target = int(input())

    left, right = 0, n - 1

    while left <= right:
        mid = (left + right) // 2

        if arr[mid] == target:
            print(mid)
            return

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

    print(-1)

search_rotated_sorted_array()