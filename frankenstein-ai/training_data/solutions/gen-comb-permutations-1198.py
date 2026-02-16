# Task: gen-comb-permutations-1198 | Score: 100% | 2026-02-11T10:36:46.606185

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