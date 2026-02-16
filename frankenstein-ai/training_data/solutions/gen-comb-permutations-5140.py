# Task: gen-comb-permutations-5140 | Score: 100% | 2026-02-11T10:22:36.781282

import itertools

def main():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    
    permutations = list(itertools.permutations(nums))
    
    for perm in sorted(permutations):
        print(*perm)

if __name__ == "__main__":
    main()