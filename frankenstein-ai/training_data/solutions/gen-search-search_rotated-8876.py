# Task: gen-search-search_rotated-8876 | Score: 100% | 2026-02-13T08:57:13.041221

def search_rotated_sorted_array():
    n = int(input())
    nums = list(map(int, input().split()))
    target = int(input())

    left, right = 0, n - 1

    while left <= right:
        mid = (left + right) // 2

        if nums[mid] == target:
            print(mid)
            return

        if nums[left] <= nums[mid]:
            if nums[left] <= target <= nums[mid]:
                right = mid - 1
            else:
                left = mid + 1
        else:
            if nums[mid] <= target <= nums[right]:
                left = mid + 1
            else:
                right = mid - 1

    print(-1)

search_rotated_sorted_array()