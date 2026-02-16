# Task: gen-comb-combinations-1320 | Score: 100% | 2026-02-11T08:51:36.443679

def solve():
  n = int(input())
  nums = []
  for _ in range(n):
    nums.append(int(input()))
  k = int(input())

  def combinations(arr, k):
    result = []
    
    def backtrack(index, current_combination):
      if len(current_combination) == k:
        result.append(current_combination[:])
        return
      
      if index >= len(arr):
        return
      
      current_combination.append(arr[index])
      backtrack(index + 1, current_combination)
      current_combination.pop()
      backtrack(index + 1, current_combination)

    backtrack(0, [])
    return result

  combos = combinations(nums, k)
  for combo in combos:
    print(*combo)

solve()