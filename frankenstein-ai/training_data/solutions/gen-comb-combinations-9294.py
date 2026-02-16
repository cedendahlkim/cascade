# Task: gen-comb-combinations-9294 | Score: 100% | 2026-02-11T09:29:36.175765

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    k = int(input())

    def combinations(arr, k):
        result = []
        
        def backtrack(start, current_combination):
            if len(current_combination) == k:
                result.append(current_combination[:])
                return
            
            for i in range(start, len(arr)):
                current_combination.append(arr[i])
                backtrack(i + 1, current_combination)
                current_combination.pop()

        backtrack(0, [])
        return result

    combs = combinations(nums, k)
    for comb in combs:
        print(*comb)

solve()