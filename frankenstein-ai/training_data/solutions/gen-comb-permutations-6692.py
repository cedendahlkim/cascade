# Task: gen-comb-permutations-6692 | Score: 100% | 2026-02-10T19:03:00.734713

import itertools

def main():
  n = int(input())
  nums = []
  for _ in range(n):
    nums.append(int(input()))
  
  permutations = sorted(list(itertools.permutations(nums)))
  
  for perm in permutations:
    print(*perm)

if __name__ == "__main__":
  main()