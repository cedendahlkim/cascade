# Task: gen-comb-permutations-9320 | Score: 100% | 2026-02-11T09:00:24.581070

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