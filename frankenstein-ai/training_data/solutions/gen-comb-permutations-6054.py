# Task: gen-comb-permutations-6054 | Score: 100% | 2026-02-10T18:03:16.951303

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))

    def permutations(arr):
        if len(arr) == 0:
            return [[]]
        
        result = []
        for i in range(len(arr)):
            first = arr[i]
            rest = arr[:i] + arr[i+1:]
            
            perms_rest = permutations(rest)
            
            for perm in perms_rest:
                result.append([first] + perm)
        
        return result

    perms = permutations(nums)
    perms.sort()

    for perm in perms:
        print(*perm)

solve()