# Task: gen-search-search_rotated-5079 | Score: 100% | 2026-02-12T20:08:51.944670

def search_rotated_sorted_array():
    n = int(input())
    nums = list(map(int, input().split()))
    target = int(input())

    def find_rotation_index(nums):
        left, right = 0, len(nums) - 1
        if nums[left] < nums[right]:
            return 0

        while left <= right:
            pivot = (left + right) // 2
            if nums[pivot] > nums[pivot + 1]:
                return pivot + 1
            else:
                if nums[pivot] < nums[left]:
                    right = pivot - 1
                else:
                    left = pivot + 1
        return 0

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

    rotation_index = find_rotation_index(nums)

    if rotation_index == 0:
        return binary_search(nums, 0, len(nums) - 1, target)

    if nums[rotation_index] <= target <= nums[-1]:
        return binary_search(nums, rotation_index, len(nums) - 1, target)
    else:
        return binary_search(nums, 0, rotation_index - 1, target)

result = search_rotated_sorted_array()
print(result)