# Task: gen-comb-permutations-6215 | Score: 100% | 2026-02-11T10:56:32.938461

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