# Task: gen-comb-subsets-3050 | Score: 100% | 2026-02-11T09:59:48.011844

def solve():
  n = int(input())
  nums = []
  for _ in range(n):
    nums.append(int(input()))

  def powerset(nums):
    result = [[]]
    for num in nums:
      new_subsets = [subset + [num] for subset in result]
      result.extend(new_subsets)
    return result

  subsets = powerset(nums)
  subsets.sort(key=lambda x: (len(x), x))

  for subset in subsets:
    print(*subset)

solve()