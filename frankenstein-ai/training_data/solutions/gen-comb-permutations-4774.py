# Task: gen-comb-permutations-4774 | Score: 100% | 2026-02-11T12:13:22.230858

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    
    import itertools
    
    permutations = list(itertools.permutations(nums))
    
    for perm in permutations:
        print(*perm)

solve()