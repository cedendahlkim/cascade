# Task: gen-search-search_rotated-7982 | Score: 100% | 2026-02-13T08:50:18.021906

def solve():
    n = int(input())
    nums = list(map(int, input().split()))
    target = int(input())

    def search(nums, target):
        l, r = 0, len(nums) - 1
        while l <= r:
            mid = (l + r) // 2
            if nums[mid] == target:
                return mid
            
            if nums[l] <= nums[mid]:
                if nums[l] <= target <= nums[mid]:
                    r = mid - 1
                else:
                    l = mid + 1
            else:
                if nums[mid] <= target <= nums[r]:
                    l = mid + 1
                else:
                    r = mid - 1
        return -1

    print(search(nums, target))

solve()