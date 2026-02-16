# Task: gen-comb-permutations-1046 | Score: 100% | 2026-02-11T07:33:05.664699

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