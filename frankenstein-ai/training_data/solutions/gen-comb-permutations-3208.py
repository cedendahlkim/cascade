# Task: gen-comb-permutations-3208 | Score: 100% | 2026-02-11T09:29:44.994171

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