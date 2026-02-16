# Task: gen-comb-combinations-8830 | Score: 100% | 2026-02-11T09:33:32.521483

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    k = int(input())

    def combinations(arr, k):
        result = []
        def backtrack(index, current):
            if len(current) == k:
                result.append(current[:])
                return
            if index >= len(arr):
                return
            
            current.append(arr[index])
            backtrack(index + 1, current)
            current.pop()
            backtrack(index + 1, current)

        backtrack(0, [])
        return result
    
    combs = combinations(nums, k)
    for comb in combs:
        print(*comb)

solve()