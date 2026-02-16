# Task: gen-comb-permutations-5721 | Score: 100% | 2026-02-11T09:11:56.982602

import itertools

def main():
  n = int(input())
  nums = []
  for _ in range(n):
    nums.append(input())

  perms = list(itertools.permutations(nums))

  for perm in perms:
    print(*perm)

if __name__ == "__main__":
  main()