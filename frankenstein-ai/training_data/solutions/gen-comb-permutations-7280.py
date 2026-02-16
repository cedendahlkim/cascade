# Task: gen-comb-permutations-7280 | Score: 100% | 2026-02-10T18:38:58.661727

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