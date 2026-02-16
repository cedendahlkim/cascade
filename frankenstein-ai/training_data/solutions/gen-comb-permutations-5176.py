# Task: gen-comb-permutations-5176 | Score: 100% | 2026-02-11T08:46:57.931501

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))

    import itertools
    permutations = list(itertools.permutations(nums))
    permutations.sort()

    for perm in permutations:
        print(*perm)

solve()