# Task: gen-search-search_rotated-1853 | Score: 100% | 2026-02-13T08:50:47.205824

def solve():
    n = int(input())
    arr = list(map(int, input().split()))
    target = int(input())

    def search(nums, target):
        left, right = 0, len(nums) - 1
        while left <= right:
            mid = (left + right) // 2
            if nums[mid] == target:
                return mid
            
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
        return -1

    print(search(arr, target))

solve()