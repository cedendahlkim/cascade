# Task: gen-comb-permutations-5414 | Score: 100% | 2026-02-10T18:46:12.893552

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