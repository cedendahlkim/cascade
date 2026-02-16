# Task: gen-comb-permutations-7426 | Score: 100% | 2026-02-11T08:44:59.638008

import itertools

def main():
  n = int(input())
  nums = []
  for _ in range(n):
    nums.append(int(input()))
  
  permutations = list(itertools.permutations(nums))
  
  permutations.sort()
  
  for perm in permutations:
    print(*perm)

if __name__ == "__main__":
  main()