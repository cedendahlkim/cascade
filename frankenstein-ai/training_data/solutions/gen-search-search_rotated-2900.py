# Task: gen-search-search_rotated-2900 | Score: 100% | 2026-02-11T12:15:59.887452

def search_rotated_sorted_array():
  n = int(input())
  nums = list(map(int, input().split()))
  target = int(input())

  left, right = 0, n - 1

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

print(search_rotated_sorted_array())