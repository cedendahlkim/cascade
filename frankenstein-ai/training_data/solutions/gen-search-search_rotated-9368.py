# Task: gen-search-search_rotated-9368 | Score: 100% | 2026-02-12T13:05:11.319517

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

    def binary_search(nums, target, left, right):
        while left <= right:
            pivot = (left + right) // 2
            if nums[pivot] == target:
                return pivot
            else:
                if target < nums[pivot]:
                    right = pivot - 1
                else:
                    left = pivot + 1
        return -1

    if not nums:
        print(-1)
        return

    rotation_index = find_rotation_index(nums)

    if nums[rotation_index] == target:
        print(rotation_index)
        return

    if rotation_index == 0:
        print(binary_search(nums, target, 0, len(nums) - 1))
        return

    if target < nums[0]:
        print(binary_search(nums, target, rotation_index, len(nums) - 1))
    else:
        print(binary_search(nums, target, 0, rotation_index - 1))

search_rotated_sorted_array()