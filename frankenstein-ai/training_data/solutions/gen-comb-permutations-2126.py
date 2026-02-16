# Task: gen-comb-permutations-2126 | Score: 100% | 2026-02-10T18:39:39.869068

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    nums.sort()

    import itertools
    permutations = list(itertools.permutations(nums))

    for perm in permutations:
        print(*perm)

solve()