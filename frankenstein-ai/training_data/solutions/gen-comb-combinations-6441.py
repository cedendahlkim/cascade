# Task: gen-comb-combinations-6441 | Score: 100% | 2026-02-11T09:21:08.469716

def solve():
  n = int(input())
  nums = []
  for _ in range(n):
    nums.append(int(input()))
  k = int(input())

  import itertools
  
  for combo in itertools.combinations(nums, k):
    print(*combo)

solve()