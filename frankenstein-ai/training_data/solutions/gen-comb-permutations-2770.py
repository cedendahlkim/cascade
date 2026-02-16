# Task: gen-comb-permutations-2770 | Score: 100% | 2026-02-10T19:01:22.250295

import itertools

def main():
  n = int(input())
  nums = []
  for _ in range(n):
    nums.append(int(input()))
  
  permutations = list(itertools.permutations(nums))
  
  for perm in permutations:
    print(*perm)

if __name__ == "__main__":
  main()