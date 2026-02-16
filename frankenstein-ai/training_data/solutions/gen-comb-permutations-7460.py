# Task: gen-comb-permutations-7460 | Score: 100% | 2026-02-11T10:54:10.429487

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