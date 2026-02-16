# Task: gen-comb-permutations-1794 | Score: 100% | 2026-02-11T10:23:54.052192

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