# Task: gen-comb-permutations-9782 | Score: 100% | 2026-02-11T11:03:56.133581

import itertools

def main():
  n = int(input())
  nums = []
  for _ in range(n):
    nums.append(int(input()))
  
  perms = list(itertools.permutations(nums))
  
  for perm in perms:
    print(*perm)

if __name__ == "__main__":
  main()