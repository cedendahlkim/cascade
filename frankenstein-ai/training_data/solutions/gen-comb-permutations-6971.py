# Task: gen-comb-permutations-6971 | Score: 100% | 2026-02-12T13:46:01.667689

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