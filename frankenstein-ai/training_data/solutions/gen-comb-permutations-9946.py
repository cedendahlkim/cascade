# Task: gen-comb-permutations-9946 | Score: 100% | 2026-02-11T10:04:43.470128

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