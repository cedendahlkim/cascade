# Task: gen-comb-combinations-4036 | Score: 100% | 2026-02-11T10:02:39.516052

def solve():
  n = int(input())
  nums = []
  for _ in range(n):
    nums.append(int(input()))
  k = int(input())

  def combinations(arr, k):
    if k == 0:
      return [[]]
    if not arr:
      return []

    result = []
    
    first = arr[0]
    rest = arr[1:]

    combinations_with_first = [[first] + comb for comb in combinations(rest, k - 1)]
    combinations_without_first = combinations(rest, k)

    result.extend(combinations_with_first)
    result.extend(combinations_without_first)

    return result

  combs = combinations(nums, k)
  for comb in combs:
    print(*comb)

solve()