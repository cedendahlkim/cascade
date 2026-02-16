# Task: gen-comb-permutations-7793 | Score: 100% | 2026-02-11T10:05:57.045776

import itertools

def main():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))

    permutations = list(itertools.permutations(nums))
    permutations.sort()

    for perm in permutations:
        print(*perm)

if __name__ == "__main__":
    main()