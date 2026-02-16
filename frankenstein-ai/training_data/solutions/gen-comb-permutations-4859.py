# Task: gen-comb-permutations-4859 | Score: 100% | 2026-02-11T08:54:41.035587

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))

    import itertools
    perms = list(itertools.permutations(nums))
    
    for perm in perms:
        print(*perm)

solve()