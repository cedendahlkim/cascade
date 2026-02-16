# Task: gen-comb-subsets-9066 | Score: 100% | 2026-02-11T09:25:18.048268

def solve():
  n = int(input())
  nums = []
  for _ in range(n):
    nums.append(input())

  def powerset(nums):
    result = []
    for i in range(1 << len(nums)):
      subset = []
      for j in range(len(nums)):
        if (i >> j) & 1:
          subset.append(nums[j])
      result.append(subset)

    result.sort(key=lambda x: (len(x), x))

    for subset in result:
      print(*subset)

  powerset(nums)

solve()