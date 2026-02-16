# Task: gen-comb-permutations-2214 | Score: 100% | 2026-02-12T18:54:01.203220

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