# Task: gen-comb-permutations-7427 | Score: 100% | 2026-02-11T07:45:12.641390

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))

    import itertools
    perms = list(itertools.permutations(nums))
    perms.sort()

    for perm in perms:
        print(*perm)

solve()