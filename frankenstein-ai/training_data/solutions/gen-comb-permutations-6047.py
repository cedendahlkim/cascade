# Task: gen-comb-permutations-6047 | Score: 100% | 2026-02-10T18:11:50.869364

import itertools

def main():
  n = int(input())
  nums = []
  for _ in range(n):
    nums.append(int(input()))

  perms = list(itertools.permutations(nums))
  perms.sort()

  for perm in perms:
    print(*perm)

if __name__ == "__main__":
  main()