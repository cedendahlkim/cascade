# Task: gen-comb-combinations-9792 | Score: 100% | 2026-02-10T19:03:09.968350

import itertools

def main():
  n = int(input())
  nums = []
  for _ in range(n):
    nums.append(int(input()))
  k = int(input())

  combinations = sorted(list(itertools.combinations(nums, k)))
  
  for comb in combinations:
    print(*comb)

if __name__ == "__main__":
  main()