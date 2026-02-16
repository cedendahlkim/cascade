# Task: gen-comb-permutations-4180 | Score: 100% | 2026-02-10T17:48:13.197439

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))

    import itertools
    perms = list(itertools.permutations(nums))
    
    perms_sorted = sorted(perms)

    for perm in perms_sorted:
        print(*perm)

solve()