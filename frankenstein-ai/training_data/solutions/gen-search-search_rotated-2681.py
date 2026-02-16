# Task: gen-search-search_rotated-2681 | Score: 100% | 2026-02-13T08:52:17.693511

def search_rotated_sorted_array():
    n = int(input())
    nums = list(map(int, input().split()))
    target = int(input())

    def find_pivot(nums):
        left, right = 0, len(nums) - 1
        while left < right:
            mid = (left + right) // 2
            if nums[mid] > nums[right]:
                left = mid + 1
            else:
                right = mid
        return left

    def binary_search(nums, left, right, target):
        while left <= right:
            mid = (left + right) // 2
            if nums[mid] == target:
                return mid
            elif nums[mid] < target:
                left = mid + 1
            else:
                right = mid - 1
        return -1

    pivot = find_pivot(nums)
    if nums[pivot] <= target <= nums[-1]:
        result = binary_search(nums, pivot, len(nums) - 1, target)
    else:
        result = binary_search(nums, 0, pivot - 1, target)

    print(result)

search_rotated_sorted_array()