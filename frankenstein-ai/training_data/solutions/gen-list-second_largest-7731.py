# Task: gen-list-second_largest-7731 | Score: 100% | 2026-02-10T15:40:27.161619

def solve():
  n = int(input())
  nums = []
  for _ in range(n):
    nums.append(int(input()))
  
  nums.sort()
  
  if len(nums) < 2:
    print(nums[0])
  else:
      
    largest = nums[-1]
    second_largest = None
    for i in range(len(nums) - 2, -1, -1):
        if nums[i] < largest:
            second_largest = nums[i]
            break
    print(second_largest)

solve()