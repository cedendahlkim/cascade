# Task: gen-comb-permutations-9248 | Score: 100% | 2026-02-11T10:29:58.441144

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