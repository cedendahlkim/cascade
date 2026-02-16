# Task: gen-comb-permutations-7765 | Score: 100% | 2026-02-11T10:14:43.650968

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