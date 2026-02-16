# Task: gen-comb-permutations-3376 | Score: 100% | 2026-02-11T09:14:29.801554

import itertools

def main():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    
    permutations = list(itertools.permutations(nums))
    
    for perm in permutations:
        print(*perm)

if __name__ == "__main__":
    main()