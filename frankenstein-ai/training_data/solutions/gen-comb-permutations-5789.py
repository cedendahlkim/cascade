# Task: gen-comb-permutations-5789 | Score: 100% | 2026-02-10T18:47:38.484003

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    nums.sort()

    import itertools
    
    permutations = list(itertools.permutations(nums))
    permutations.sort()

    for perm in permutations:
        print(*perm)

solve()