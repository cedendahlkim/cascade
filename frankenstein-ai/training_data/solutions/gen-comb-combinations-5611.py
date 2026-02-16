# Task: gen-comb-combinations-5611 | Score: 100% | 2026-02-11T09:57:01.542486

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    k = int(input())

    def combinations(arr, k):
        result = []
        
        def backtrack(combination, start):
            if len(combination) == k:
                result.append(combination[:])
                return
            
            for i in range(start, len(arr)):
                combination.append(arr[i])
                backtrack(combination, i + 1)
                combination.pop()
        
        backtrack([], 0)
        return result

    combos = combinations(nums, k)
    for combo in combos:
        print(*combo)

solve()