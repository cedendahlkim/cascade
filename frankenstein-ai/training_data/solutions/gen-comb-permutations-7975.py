# Task: gen-comb-permutations-7975 | Score: 100% | 2026-02-10T17:57:51.814210

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