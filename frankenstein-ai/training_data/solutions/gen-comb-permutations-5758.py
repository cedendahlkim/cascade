# Task: gen-comb-permutations-5758 | Score: 100% | 2026-02-11T10:16:01.204645

import itertools

def main():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(input())

    permutations = list(itertools.permutations(nums))
    
    for perm in permutations:
        print(*perm)

if __name__ == "__main__":
    main()