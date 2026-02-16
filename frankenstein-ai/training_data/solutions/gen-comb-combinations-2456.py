# Task: gen-comb-combinations-2456 | Score: 100% | 2026-02-10T18:02:17.840806

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    k = int(input())

    def combinations(arr, k):
        result = []
        
        def backtrack(index, current_combination):
            if len(current_combination) == k:
                result.append(current_combination[:])
                return
            
            if index >= len(arr):
                return
            
            current_combination.append(arr[index])
            backtrack(index + 1, current_combination)
            current_combination.pop()
            backtrack(index + 1, current_combination)
        
        backtrack(0, [])
        return result

    combs = combinations(nums, k)
    for comb in combs:
        print(*comb)

solve()