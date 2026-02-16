# Task: gen-comb-permutations-4425 | Score: 100% | 2026-02-11T10:47:12.434638

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