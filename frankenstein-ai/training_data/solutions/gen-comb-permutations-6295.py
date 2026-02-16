# Task: gen-comb-permutations-6295 | Score: 100% | 2026-02-11T10:07:20.771378

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