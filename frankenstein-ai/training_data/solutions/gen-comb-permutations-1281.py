# Task: gen-comb-permutations-1281 | Score: 100% | 2026-02-10T18:38:40.999968

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