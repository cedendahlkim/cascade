# Task: gen-comb-combinations-8625 | Score: 100% | 2026-02-10T18:12:25.959433

import itertools

def main():
  n = int(input())
  nums = []
  for _ in range(n):
    nums.append(int(input()))
  k = int(input())

  combs = list(itertools.combinations(nums, k))

  for comb in combs:
    print(*comb)

if __name__ == "__main__":
  main()