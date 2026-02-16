# Task: gen-comb-permutations-1609 | Score: 100% | 2026-02-11T09:22:42.087256

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