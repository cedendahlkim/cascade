# Task: gen-comb-permutations-8374 | Score: 100% | 2026-02-10T18:43:49.563842

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