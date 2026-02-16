# Task: gen-comb-permutations-9010 | Score: 100% | 2026-02-11T09:09:14.559032

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