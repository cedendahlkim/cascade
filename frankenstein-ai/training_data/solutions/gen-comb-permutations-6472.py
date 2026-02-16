# Task: gen-comb-permutations-6472 | Score: 100% | 2026-02-11T09:57:40.032156

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