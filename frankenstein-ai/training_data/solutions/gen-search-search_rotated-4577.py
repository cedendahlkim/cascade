# Task: gen-search-search_rotated-4577 | Score: 100% | 2026-02-15T10:28:12.767932

n = int(input())
arr = list(map(int, input().split()))
target = int(input())
lo, hi = 0, n - 1
result = -1
while lo <= hi:
    mid = (lo + hi) // 2
    if arr[mid] == target:
        result = mid
        break
    if arr[lo] <= arr[mid]:
        if arr[lo] <= target < arr[mid]:
            hi = mid - 1
        else:
            lo = mid + 1
    else:
        if arr[mid] < target <= arr[hi]:
            lo = mid + 1
        else:
            hi = mid - 1
print(result)